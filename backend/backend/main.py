from typing import Set, Optional
from datetime import datetime, timedelta, date
from decimal import Decimal
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import jwt
import pandas as pd
import pymysql
import io

from database_mongo import (
    mongo_products,
    mongo_categories,
)

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
def require_roles(*allowed_roles: str):
    def role_checker(
        current_user: dict = Depends(get_current_user)
    ):
        user_role = current_user.get("role")

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này"
            )

        return current_user

    return role_checker
class ReceiptDetailInput(BaseModel):
    product_id: int
    batch_number: str
    import_date: date
    expiry_date: date
    quantity: int = Field(gt=0)
    unit_cost: Optional[Decimal] = None


class ReceiptCreate(BaseModel):
    receipt_code: str
    supplier_name: Optional[str] = None
    note: Optional[str] = None
    details: list[ReceiptDetailInput] = Field(min_length=1)


class IssueDetailInput(BaseModel):
    batch_id: int
    quantity: int = Field(gt=0)


class IssueCreate(BaseModel):
    issue_code: str
    issue_date: Optional[datetime] = None
    recipient: Optional[str] = None
    reason: Optional[str] = None
    note: Optional[str] = None
    details: list[IssueDetailInput] = Field(min_length=1)


# ---------- CREATE RECEIPT DRAFT ----------

@app.post("/api/v1/receipts")
def create_receipt(
    data: ReceiptCreate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO goods_receipts
                    (receipt_code, supplier_name, note, created_by)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    data.receipt_code,
                    data.supplier_name,
                    data.note,
                    int(current_user["sub"])
                )
            )

            receipt_id = cursor.lastrowid

            for item in data.details:
                if item.expiry_date < item.import_date:
                    raise HTTPException(
                        status_code=400,
                        detail="Hạn sử dụng không được trước ngày nhập"
                    )

                cursor.execute(
                    "SELECT id FROM products WHERE id = %s",
                    (item.product_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Không tìm thấy sản phẩm ID {item.product_id}"
                    )

                cursor.execute(
                    """
                    INSERT INTO goods_receipt_details
                    (
                        receipt_id, product_id, batch_number,
                        import_date, expiry_date, quantity,unit_cost
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        receipt_id,
                        item.product_id,
                        item.batch_number,
                        item.import_date,
                        item.expiry_date,
                        item.quantity,
                        item.unit_cost,
                    )
                )

        conn.commit()
        return {
            "message": "Tạo phiếu nhập nháp thành công",
            "receipt_id": receipt_id,
            "status": "DRAFT"
        }

    except HTTPException:
        conn.rollback()
        raise
    except pymysql.err.IntegrityError as exc:
        conn.rollback()
        raise HTTPException(
            status_code=409,
            detail="Mã phiếu nhập đã tồn tại hoặc dữ liệu vi phạm ràng buộc"
        ) from exc
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi tạo phiếu nhập: {str(exc)}"
        ) from exc
    finally:
        conn.close()

@app.post("/api/v1/receipts/{receipt_id}/confirm")
def confirm_receipt(
    receipt_id: int,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            # Khóa phiếu để ngăn xác nhận lặp đồng thời.
            cursor.execute(
                """
                SELECT *
                FROM goods_receipts
                WHERE receipt_id = %s
                FOR UPDATE
                """,
                (receipt_id,)
            )
            receipt = cursor.fetchone()

            if not receipt:
                raise HTTPException(404, "Không tìm thấy phiếu nhập")

            if receipt["status"] != "DRAFT":
                raise HTTPException(
                    409,
                    "Chỉ được xác nhận phiếu đang ở trạng thái DRAFT"
                )

            cursor.execute(
                """
                SELECT *
                FROM goods_receipt_details
                WHERE receipt_id = %s
                """,
                (receipt_id,)
            )
            details = cursor.fetchall()

            if not details:
                raise HTTPException(400, "Phiếu nhập chưa có chi tiết")

            for item in details:
                cursor.execute(
                    """
                    SELECT id, original_qty, current_qty
                    FROM batches
                    WHERE product_id = %s AND batch_number = %s
                    FOR UPDATE
                    """,
                    (item["product_id"], item["batch_number"])
                )
                batch = cursor.fetchone()

                if batch:
                    # Chỉ cộng tồn khi xác nhận phiếu.
                    cursor.execute(
                        """
                        UPDATE batches
                        SET original_qty = original_qty + %s,
                            current_qty = current_qty + %s,
                            import_date = %s,
                            expiry_date = %s
                        WHERE id = %s
                        """,
                        (
                            item["quantity"],
                            item["quantity"],
                            item["import_date"],
                            item["expiry_date"],
                            batch["id"]
                        )
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO batches
                        (
                            product_id, batch_number, import_date,
                            expiry_date, original_qty, current_qty,
                            risk_level
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            item["product_id"],
                            item["batch_number"],
                            item["import_date"],
                            item["expiry_date"],
                            item["quantity"],
                            item["quantity"],
                            "Safe"
                        )
                    )

            cursor.execute(
                """
                UPDATE goods_receipts
                SET status = 'CONFIRMED',
                    confirmed_by = %s,
                    confirmed_at = NOW()
                WHERE receipt_id = %s
                """,
                (int(current_user["sub"]), receipt_id)
            )

        conn.commit()
        return {"message": "Xác nhận phiếu nhập thành công"}

    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xác nhận phiếu nhập: {str(exc)}"
        ) from exc
    finally:
        conn.close()

@app.get("/api/v1/receipts")
def get_receipts(
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    receipt_id, receipt_code, receipt_date,
                    supplier_name, note, status,
                    created_by, confirmed_by, confirmed_at
                FROM goods_receipts
                ORDER BY receipt_id DESC
                """
            )
            return cursor.fetchall()
    finally:
        conn.close()


@app.get("/api/v1/receipts/{receipt_id}")
def get_receipt_detail(
    receipt_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM goods_receipts
                WHERE receipt_id = %s
                """,
                (receipt_id,)
            )
            receipt = cursor.fetchone()

            if not receipt:
                raise HTTPException(404, "Không tìm thấy phiếu nhập")

            cursor.execute(
                """
                SELECT
                    d.*, p.sku, p.name AS product_name
                FROM goods_receipt_details d
                JOIN products p ON p.id = d.product_id
                WHERE d.receipt_id = %s
                """,
                (receipt_id,)
            )
            receipt["details"] = cursor.fetchall()
            return receipt
    finally:
        conn.close()

@app.post("/api/v1/issues")
def create_issue(
    data: IssueCreate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO goods_issues
                    (issue_code, issue_date, recipient, reason, note, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    data.issue_code,
                    data.issue_date,
                    data.recipient,
                    data.reason,
                    data.note,
                    int(current_user["sub"])
                )
            )
            issue_id = cursor.lastrowid

            for item in data.details:
                cursor.execute(
                    """
                    INSERT INTO goods_issue_details
                        (issue_id, batch_id, quantity)
                    VALUES (%s, %s, %s)
                    """,
                    (issue_id, item.batch_id, item.quantity)
                )

        conn.commit()
        return {
            "message": "Tạo phiếu xuất nháp thành công",
            "issue_id": issue_id,
            "status": "DRAFT"
        }

    except HTTPException:
        conn.rollback()
        raise
    except pymysql.err.IntegrityError as exc:
        conn.rollback()
        raise HTTPException(
            status_code=409,
            detail="Mã phiếu xuất đã tồn tại hoặc dữ liệu không hợp lệ"
        ) from exc
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi tạo phiếu xuất: {str(exc)}"
        ) from exc
    finally:
        conn.close()

@app.post("/api/v1/issues/{issue_id}/confirm")
def confirm_issue(
    issue_id: int,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS db_name")
            print("DEBUG DATABASE:", cursor.fetchone())
            cursor.execute(
                """
                SELECT *
                FROM goods_issues
                WHERE issue_id = %s
                FOR UPDATE
                """,
                (issue_id,)
            )
            issue = cursor.fetchone()

            if not issue:
                raise HTTPException(404, "Không tìm thấy phiếu xuất")

            if issue["status"] != "DRAFT":
                raise HTTPException(
                    409,
                    "Chỉ được xác nhận phiếu đang ở trạng thái DRAFT"
                )

            cursor.execute(
                """
                SELECT batch_id, SUM(quantity) AS total_qty
                FROM goods_issue_details
                WHERE issue_id = %s
                GROUP BY batch_id
                ORDER BY batch_id
                """,
                (issue_id,)
            )
            details = cursor.fetchall()

            if not details:
                raise HTTPException(400, "Phiếu xuất chưa có chi tiết")

            for item in details:
                cursor.execute(
                    """
                    SELECT id, current_qty, expiry_date
                    FROM batches
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (item["batch_id"],)
                )
                batch = cursor.fetchone()

                if not batch:
                    raise HTTPException(
                        404,
                        f"Không tìm thấy lô ID {item['batch_id']}"
                    )

                if batch["expiry_date"] < date.today():
                    raise HTTPException(
                        400,
                        f"Lô ID {item['batch_id']} đã hết hạn"
                    )

                if batch["current_qty"] < item["total_qty"]:
                    raise HTTPException(
                        400,
                        f"Lô ID {item['batch_id']} không đủ tồn kho"
                    )

                cursor.execute(
                    """
                    UPDATE batches
                    SET current_qty = current_qty - %s
                    WHERE id = %s AND current_qty >= %s
                    """,
                    (
                        item["total_qty"],
                        item["batch_id"],
                        item["total_qty"]
                    )
                )

                if cursor.rowcount != 1:
                    raise HTTPException(
                        409,
                        "Tồn kho thay đổi; hãy tải lại dữ liệu và thử lại"
                    )

            cursor.execute(
                """
                UPDATE goods_issues
                SET status = 'CONFIRMED',
                    confirmed_by = %s,
                    confirmed_at = NOW()
                WHERE issue_id = %s
                """,
                (int(current_user["sub"]), issue_id)
            )

        conn.commit()
        return {"message": "Xác nhận phiếu xuất thành công"}

    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xác nhận phiếu xuất: {str(exc)}"
        ) from exc
    finally:
        conn.close()

@app.get("/api/v1/issues")
def get_issues(
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    issue_id, issue_code, issue_date,
                    recipient, reason, note, status,
                    created_by, confirmed_by, confirmed_at
                FROM goods_issues
                ORDER BY issue_id DESC
                """
            )
            return cursor.fetchall()
    finally:
        conn.close()


@app.get("/api/v1/issues/{issue_id}")
def get_issue_detail(
    issue_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM goods_issues
                WHERE issue_id = %s
                """,
                (issue_id,)
            )
            issue = cursor.fetchone()

            if not issue:
                raise HTTPException(404, "Không tìm thấy phiếu xuất")

            cursor.execute(
                """
                SELECT
                    d.detail_id, d.batch_id, d.quantity,
                    b.batch_number, b.expiry_date,
                    p.name AS product_name, p.sku
                FROM goods_issue_details d
                JOIN batches b ON b.id = d.batch_id
                JOIN products p ON p.id = b.product_id
                WHERE d.issue_id = %s
                """,
                (issue_id,)
            )
            issue["details"] = cursor.fetchall()
            return issue
    finally:
        conn.close()

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
def create_product(
    product: ProductCreate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
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
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
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
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
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


@app.get("/api/v1/batches")
def get_batches(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            
            
            sql = """
                SELECT
                    b.id,
                    b.product_id,
                    b.batch_number,
                    b.import_date,
                    b.expiry_date,
                    b.original_qty,
                    b.current_qty,
                    p.name AS product_name,
                    p.sku AS product_sku
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
class BatchUpdate(BaseModel):
    batch_number: str
    expiry_date: str
    current_qty: int


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
                    current_qty = %s
                WHERE id = %s
            """

            cursor.execute(
                sql,
                (
                    batch.batch_number,
                    batch.expiry_date,
                    batch.current_qty,
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

@app.get("/api/v1/dataset/products")
def get_dataset_products(limit: int = 50, skip: int = 0):
    if limit < 1 or limit > 200:
        raise HTTPException(
            status_code=400,
            detail="limit phải nằm trong khoảng 1 đến 200",
        )

    if skip < 0:
        raise HTTPException(
            status_code=400,
            detail="skip không được âm",
        )

    try:
        cursor = (
            mongo_products
            .find({}, {"_id": 0})
            .skip(skip)
            .limit(limit)
        )
        return list(cursor)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Không thể đọc sản phẩm từ MongoDB",
        ) from exc


@app.get("/api/v1/dataset/categories")
def get_dataset_categories():
    try:
        return list(
            mongo_categories.find({}, {"_id": 0})
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Không thể đọc danh mục từ MongoDB",
        ) from exc