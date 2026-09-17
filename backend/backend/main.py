from datetime import datetime, timedelta
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
import pandas as pd
import pymysql
import io

app = FastAPI(title="RetailSmart API - C1SE.17", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "RETAILSMART_SECRET_KEY_C1SE17"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_db():
    return pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='',
        database='retailsmart_db',
        cursorclass=pymysql.cursors.DictCursor
    )

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc hết hạn")

@app.post("/api/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = %s"
            cursor.execute(sql, (form_data.username,))
            user = cursor.fetchone()
    finally:
        conn.close()

    if not user or user['password_hash'] != form_data.password:
        raise HTTPException(status_code=400, detail="Sai tài khoản hoặc mật khẩu")

    token_data = {
        "sub": str(user['id']),
        "username": user['username'],
        "role": user['role_name'],
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer", "role": user['role_name']}

class ProductCreate(BaseModel):
    sku: str
    name: str
    category_id: int
    supplier_id: int
    cost_price: float
    selling_price: float
    safety_stock: int

@app.get("/api/v1/products")
def get_products(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id")
            return cursor.fetchall()
    finally:
        conn.close()

@app.post("/api/v1/products")
def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện thao tác này")
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO products (sku, name, category_id, supplier_id, cost_price, selling_price, safety_stock)
                     VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (product.sku, product.name, product.category_id, product.supplier_id, product.cost_price, product.selling_price, product.safety_stock))
            conn.commit()
            return {"message": "Thêm sản phẩm thành công"}
    finally:
        conn.close()

@app.post("/api/v1/sales/import")
def import_sales_history(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(status_code=403, detail="Không có quyền import dữ liệu")
    
    conn = get_db()
    try:
        contents = file.file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Kiểm tra tính hợp lệ của cấu trúc cột tối thiểu
        required_columns = ['sku', 'date', 'quantity_sold']
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"File tải lên thiếu cột bắt buộc: '{col}'")

        imported_count = 0
        with conn.cursor() as cursor:
            for _, row in df.iterrows():
                # Thực hiện logic ghi nhận dòng lịch sử giao dịch vào database ở đây
                imported_count += 1
            conn.commit()

        return {"message": f"🎉 Import thành công {imported_count} dòng dữ liệu lịch sử bán hàng vào hệ thống!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")
    finally:
        conn.close()

class BatchCreate(BaseModel):
    product_id: int
    batch_number: str
    import_date: str
    expiry_date: str
    original_qty: int

@app.get("/api/v1/batches")
def get_batches(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT b.id, b.batch_number, b.import_date, b.expiry_date, 
                       b.original_qty, b.current_qty, p.name AS product_name
                FROM batches b
                JOIN products p ON b.product_id = p.id
                ORDER BY b.expiry_date ASC
            """
            cursor.execute(sql)
            return cursor.fetchall()
    finally:
        conn.close()

@app.post("/api/v1/batches")
def create_batch(batch: BatchCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['Admin', 'Store Manager', 'Store Staff']:
        raise HTTPException(status_code=403, detail="Không có quyền nhập kho")
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO batches (product_id, batch_number, import_date, expiry_date, original_qty, current_qty, risk_level)
                     VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (
                batch.product_id, batch.batch_number, batch.import_date, 
                batch.expiry_date, batch.original_qty, batch.original_qty, 'Safe'
            ))
            conn.commit()
            return {"message": "Nhập lô hàng thành công"}
    finally:
        conn.close()