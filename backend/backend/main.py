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
#Tạo kết nối tới CSDL MySQL
def get_db():
    return pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='',
        database='retailsmart_db',
        cursorclass=pymysql.cursors.DictCursor
    )
#Xác thực Token từ người dùng gửi lên
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
    unit: str
    status: str = "Đang bán"

@app.get("/api/v1/products")
def get_products(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    p.*,
                    c.name AS category_name,
                    COALESCE(SUM(b.current_qty), 0) AS stock
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN batches b ON b.product_id = p.id
                GROUP BY p.id
            """)
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
            sql = """INSERT INTO products (
                sku,
                name,
                category_id,
                supplier_id,
                cost_price,
                selling_price,
                safety_stock,
                unit,
                status
                )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s)"""

            cursor.execute(sql, (
                product.sku,
                product.name,
                product.category_id,
                product.supplier_id,
                product.cost_price,
                product.selling_price,
                product.safety_stock,
                product.unit,
                product.status
            ))
            conn.commit()
            return {"message": "Thêm sản phẩm thành công"}
    finally:
        conn.close()
@app.get("/api/v1/categories")
def get_categories(current_user: dict = Depends(get_current_user)):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name
                FROM categories
                ORDER BY id ASC
            """)

            return cursor.fetchall()

    finally:
        conn.close()

@app.post("/api/v1/sales/import")
def import_sales_history(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(
            status_code=403,
            detail="Không có quyền import dữ liệu"
        )

    conn = get_db()

    try:
        contents = file.file.read()

        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Kiểm tra các cột bắt buộc
        required_columns = [
            'sku',
            'date',
            'quantity_sold'
        ]

        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"File tải lên thiếu cột bắt buộc: '{col}'"
                )

        imported_count = 0

        with conn.cursor() as cursor:

            for _, row in df.iterrows():

                # Tìm sản phẩm theo SKU
                cursor.execute(
                    "SELECT id, selling_price FROM products WHERE sku = %s",
                    (str(row['sku']),)
                )

                product = cursor.fetchone()

                if not product:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Không tìm thấy sản phẩm có SKU: {row['sku']}"
                    )

                # Nếu file không có giá bán thì lấy giá hiện tại của sản phẩm
                selling_price = product['selling_price']

                # Ghi lịch sử bán hàng
                sql = """
                    INSERT INTO sales (
                        product_id,
                        sale_date,
                        quantity_sold,
                        selling_price
                    )
                    VALUES (%s, %s, %s, %s)
                """

                cursor.execute(
                    sql,
                    (
                        product['id'],
                        row['date'],
                        int(row['quantity_sold']),
                        selling_price
                    )
                )

                imported_count += 1

            conn.commit()

        return {
            "message": f"🎉 Import thành công {imported_count} dòng dữ liệu bán hàng!"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Lỗi import dữ liệu: {str(e)}"
        )

    finally:
        conn.close()
@app.get("/api/v1/sales")
def get_sales(current_user: dict = Depends(get_current_user)):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    s.id,
                    s.product_id,
                    p.sku,
                    p.name AS product_name,
                    s.sale_date,
                    s.quantity_sold,
                    s.selling_price
                FROM sales s
                JOIN products p ON s.product_id = p.id
                ORDER BY s.sale_date DESC, s.id DESC
            """)

            return cursor.fetchall()

    finally:
        conn.close()
@app.put("/api/v1/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(
            status_code=403,
            detail="Không có quyền thực hiện thao tác này"
        )

    conn = get_db()

    try:
        with conn.cursor() as cursor:
            # Kiểm tra sản phẩm có tồn tại không
            cursor.execute(
                "SELECT id FROM products WHERE id = %s",
                (product_id,)
            )

            existing_product = cursor.fetchone()

            if not existing_product:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy sản phẩm"
                )

            # Kiểm tra SKU có bị trùng với sản phẩm khác không
            cursor.execute(
                "SELECT id FROM products WHERE sku = %s AND id != %s",
                (product.sku, product_id)
            )

            duplicate_sku = cursor.fetchone()

            if duplicate_sku:
                raise HTTPException(
                    status_code=400,
                    detail="SKU đã tồn tại ở sản phẩm khác"
                )

            # Cập nhật sản phẩm
            sql = """
                UPDATE products
                SET sku = %s,
                    name = %s,
                    category_id = %s,
                    supplier_id = %s,
                    cost_price = %s,
                    selling_price = %s,
                    safety_stock = %s,
                    unit = %s,
                    status=%s
                WHERE id = %s
            """

            cursor.execute(
                sql,
                (
                    product.sku,
                    product.name,
                    product.category_id,
                    product.supplier_id,
                    product.cost_price,
                    product.selling_price,
                    product.safety_stock,
                    product.unit,
                    product.status,
                    product_id
                )
            )

            conn.commit()

            return {
                "message": "Cập nhật sản phẩm thành công"
            }

    finally:
        conn.close()
@app.delete("/api/v1/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(
            status_code=403,
            detail="Không có quyền xóa sản phẩm"
        )

    conn = get_db()

    try:
        with conn.cursor() as cursor:

            # Kiểm tra sản phẩm có tồn tại không
            cursor.execute(
                "SELECT id FROM products WHERE id = %s",
                (product_id,)
            )

            existing_product = cursor.fetchone()

            if not existing_product:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy sản phẩm"
                )

            # Xóa các batch thuộc sản phẩm trước
            cursor.execute(
                "DELETE FROM batches WHERE product_id = %s",
                (product_id,)
            )
            # Xóa lịch sử bán hàng của sản phẩm
            cursor.execute(
                "DELETE FROM sales WHERE product_id = %s",
                (product_id,)
            )
                        # Sau đó xóa sản phẩm
            cursor.execute(
                "DELETE FROM products WHERE id = %s",
                (product_id,)
            )

            conn.commit()

            return {
                "message": "Xóa sản phẩm thành công"
            }

    finally:
        conn.close()

class BatchCreate(BaseModel):
    product_id: int
    batch_number: str
    import_date: str
    expiry_date: str
    original_qty: int
    warehouse_location: str | None = None


@app.get("/api/v1/batches")
def get_batches(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT b.id,
                    b.product_id,
                    b.batch_number,
                    b.import_date,
                    b.expiry_date,
                    b.original_qty,
                    b.current_qty,
                    b.warehouse_location,
                    p.name AS product_name
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
            sql = """INSERT INTO batches (product_id, batch_number, import_date, expiry_date, original_qty, current_qty, risk_level,warehouse_location)
                     VALUES (%s, %s, %s, %s, %s, %s, %s,%s)"""
            cursor.execute(sql, (
                batch.product_id, batch.batch_number, batch.import_date, 
                batch.expiry_date, batch.original_qty, batch.original_qty, 'Safe',batch.warehouse_location
            ))
            conn.commit()
            return {"message": "Nhập lô hàng thành công"}
    finally:
        conn.close()
class BatchUpdate(BaseModel):
    batch_number: str
    expiry_date: str
    current_qty: int
    warehouse_location: str | None = None


@app.put("/api/v1/batches/{batch_id}")
def update_batch(
    batch_id: int,
    batch: BatchUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['Admin', 'Store Manager', 'Store Staff']:
        raise HTTPException(
            status_code=403,
            detail="Không có quyền cập nhật lô hàng"
        )

    conn = get_db()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM batches WHERE id = %s",
                (batch_id,)
            )

            existing_batch = cursor.fetchone()

            if not existing_batch:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy lô hàng"
                )

            sql = """
                UPDATE batches
                SET batch_number = %s,
                    expiry_date = %s,
                    current_qty = %s,
                    warehouse_location = %s
                WHERE id = %s
            """

            cursor.execute(
                sql,
                (
                    batch.batch_number,
                    batch.expiry_date,
                    batch.current_qty,
                    batch.warehouse_location,
                    batch_id
                )
            )

            conn.commit()

            return {
                "message": "Cập nhật lô hàng thành công"
            }

    finally:
        conn.close()
@app.delete("/api/v1/batches/{batch_id}")
def delete_batch(
    batch_id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['Admin', 'Store Manager']:
        raise HTTPException(
            status_code=403,
            detail="Không có quyền xóa lô hàng"
        )

    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM batches WHERE id = %s",
                (batch_id,)
            )

            existing_batch = cursor.fetchone()

            if not existing_batch:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy lô hàng"
                )

            cursor.execute(
                "DELETE FROM batches WHERE id = %s",
                (batch_id,)
            )

            conn.commit()

            return {
                "message": "Xóa lô hàng thành công"
            }

    finally:
        conn.close()