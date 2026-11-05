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
    product_id: int
    quantity: int = Field(gt=0)

    # Chỉ có giá trị khi nhân viên yêu cầu xuất khác FEFO
    requested_batch_id: Optional[int] = None
    requested_cost_lot_id: Optional[int] = None
    exception_reason: Optional[str] = None


class IssueCreate(BaseModel):
    issue_code: str
    issue_date: Optional[datetime] = None
    recipient: Optional[str] = None
    reason: Optional[str] = None
    note: Optional[str] = None
    details: list[IssueDetailInput] = Field(min_length=1)
class FefoExceptionReview(BaseModel):
    review_note: Optional[str] = None

# ---------- CREATE RECEIPT DRAFT ----------

@app.post("/api/v1/receipts")
def create_receipt(
    data: ReceiptCreate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager", "Store Staff")
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
                    # Batch vật lý có thể chứa nhiều lần nhập với giá khác nhau.
                    cursor.execute(
                        """
                        UPDATE batches
                        SET original_qty = original_qty + %s,
                            current_qty = current_qty + %s,
                            import_date = LEAST(import_date, %s),
                            expiry_date = LEAST(expiry_date, %s)
                        WHERE id = %s
                        """,
                        (item["quantity"], item["quantity"],
                         item["import_date"], item["expiry_date"], batch["id"])
                    )
                    batch_id = batch["id"]
                else:
                    cursor.execute(
                        """
                        INSERT INTO batches
                        (product_id, batch_number, import_date, expiry_date,
                         original_qty, current_qty, risk_level)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (item["product_id"], item["batch_number"],
                         item["import_date"], item["expiry_date"],
                         item["quantity"], item["quantity"], "Safe")
                    )
                    batch_id = cursor.lastrowid

                # Mỗi dòng nhập tạo một cost lot riêng, không gộp giá vốn.
                if item["unit_cost"] is None:
                    raise HTTPException(400, "Chi tiết phiếu nhập phải có giá nhập đơn vị để theo dõi giá vốn")
                cursor.execute(
                    """
                    INSERT INTO batch_cost_lots
                        (batch_id, receipt_detail_id, unit_cost, received_qty, remaining_qty)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (batch_id, item["detail_id"], item["unit_cost"],
                     item["quantity"], item["quantity"])
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
        require_roles("Admin", "Store Manager", "Store Staff")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            print("CURRENT USER:", current_user)
            cursor.execute(
                """
                INSERT INTO goods_issues (
                    issue_code, issue_date, recipient, reason, note, status, created_by
                )
                VALUES (%s, %s, %s, %s, %s, 'DRAFT', %s)
                """,
                (
                    data.issue_code,
                    data.issue_date or datetime.now(),
                    data.recipient,
                    data.reason,
                    data.note,
                    int(current_user["sub"])
                )
            )

            issue_id = cursor.lastrowid
            requested_by = int(current_user["sub"])
            today = date.today()

            for item in data.details:
                # Kiểm tra sản phẩm
                cursor.execute(
                    "SELECT id FROM products WHERE id = %s",
                    (item.product_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        404,
                        f"Không tìm thấy sản phẩm ID {item.product_id}"
                    )

                is_exception = (
                    item.requested_batch_id is not None
                    or item.requested_cost_lot_id is not None
                    or item.exception_reason is not None
                )

                # Tạo chi tiết phiếu xuất nháp
                cursor.execute(
                    """
                    INSERT INTO goods_issue_details
                        (issue_id, product_id, quantity)
                    VALUES (%s, %s, %s)
                    """,
                    (issue_id, item.product_id, item.quantity)
                )
                detail_id = cursor.lastrowid

                # Không có yêu cầu ngoại lệ: giữ luồng FEFO mặc định
                if not is_exception:
                    continue

                # Phải cung cấp đủ thông tin ngoại lệ
                if (
                    item.requested_batch_id is None
                    or item.requested_cost_lot_id is None
                    or not item.exception_reason
                    or not item.exception_reason.strip()
                ):
                    raise HTTPException(
                        400,
                        "Yêu cầu ngoại lệ FEFO phải có batch, cost lot và lý do"
                    )

                # Kiểm tra cost lot thuộc đúng sản phẩm và batch
                cursor.execute(
                    """
                    SELECT
                        cl.id AS cost_lot_id,
                        cl.batch_id,
                        cl.remaining_qty,
                        cl.unit_cost,
                        b.product_id,
                        b.batch_number,
                        b.expiry_date,
                        b.current_qty
                    FROM batch_cost_lots cl
                    JOIN batches b ON b.id = cl.batch_id
                    WHERE cl.id = %s
                      AND b.id = %s
                      AND b.product_id = %s
                    FOR UPDATE
                    """,
                    (
                        item.requested_cost_lot_id,
                        item.requested_batch_id,
                        item.product_id
                    )
                )
                selected_lot = cursor.fetchone()

                if not selected_lot:
                    raise HTTPException(
                        404,
                        "Cost lot không tồn tại hoặc không thuộc sản phẩm/lô đã chọn"
                    )

                if selected_lot["expiry_date"] < today:
                    raise HTTPException(
                        400,
                        "Không thể yêu cầu xuất lô đã hết hạn"
                    )

                if (
                    int(selected_lot["remaining_qty"]) < item.quantity
                    or int(selected_lot["current_qty"]) < item.quantity
                ):
                    raise HTTPException(
                        400,
                        "Số lượng tồn của cost lot hoặc batch không đủ"
                    )

                # Tìm cost lot FEFO ưu tiên hiện tại
                cursor.execute(
                    """
                    SELECT cl.id AS cost_lot_id, cl.batch_id
                    FROM batch_cost_lots cl
                    JOIN batches b ON b.id = cl.batch_id
                    WHERE b.product_id = %s
                      AND cl.remaining_qty > 0
                      AND b.current_qty > 0
                      AND b.expiry_date >= %s
                    ORDER BY
                        b.expiry_date ASC,
                        b.import_date ASC,
                        cl.id ASC
                    LIMIT 1
                    """,
                    (item.product_id, today)
                )
                fefo_lot = cursor.fetchone()

                if not fefo_lot:
                    raise HTTPException(
                        400,
                        "Sản phẩm hiện không có cost lot hợp lệ để xuất theo FEFO"
                    )

                if int(fefo_lot["cost_lot_id"]) == item.requested_cost_lot_id:
                    raise HTTPException(
                        400,
                        "Lô đã chọn đang là lô FEFO ưu tiên, không cần tạo yêu cầu ngoại lệ"
                    )

                # Ghi yêu cầu ngoại lệ, chưa trừ tồn kho
                cursor.execute(
                    """
                    INSERT INTO fefo_exception_requests
                    (
                        issue_id,
                        detail_id,
                        product_id,
                        suggested_batch_id,
                        requested_batch_id,
                        requested_cost_lot_id,
                        requested_qty,
                        reason,
                        status,
                        requested_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'PENDING', %s)
                    """,
                    (
                        issue_id,
                        detail_id,
                        item.product_id,
                        fefo_lot["batch_id"],
                        item.requested_batch_id,
                        item.requested_cost_lot_id,
                        item.quantity,
                        item.exception_reason.strip(),
                        requested_by
                    )
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
        print("CREATE ISSUE INTEGRITY ERROR:", repr(exc))
        raise HTTPException(
            status_code=409,
            detail=f"Database integrity error: {exc}"
        ) from exc

    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            500,
            f"Lỗi tạo phiếu xuất: {str(exc)}"
        ) from exc

    finally:
        conn.close()


@app.post("/api/v1/issues/{issue_id}/confirm")
def confirm_issue(
    issue_id: int,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager", "Store Staff")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            # 1. Khóa phiếu xuất
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

            # 2. Lấy tất cả chi tiết chưa được phân bổ
            cursor.execute(
                """
                SELECT detail_id, product_id, quantity
                FROM goods_issue_details
                WHERE issue_id = %s
                  AND batch_id IS NULL
                ORDER BY detail_id
                FOR UPDATE
                """,
                (issue_id,)
            )
            draft_details = cursor.fetchall()

            if not draft_details:
                raise HTTPException(
                    400,
                    "Phiếu xuất không có dòng sản phẩm cần phân bổ"
                )

            today = date.today()

            for draft in draft_details:
                detail_id = draft["detail_id"]
                product_id = draft["product_id"]
                requested_qty = int(draft["quantity"])

                # 3. Kiểm tra yêu cầu ngoại lệ của dòng này
                cursor.execute(
                    """
                    SELECT *
                    FROM fefo_exception_requests
                    WHERE detail_id = %s
                    FOR UPDATE
                    """,
                    (detail_id,)
                )
                exception = cursor.fetchone()

                if exception:
                    if exception["status"] == "PENDING":
                        raise HTTPException(
                            409,
                            f"Dòng chi tiết {detail_id} đang chờ duyệt ngoại lệ FEFO"
                        )

                    if exception["status"] == "REJECTED":
                        raise HTTPException(
                            409,
                            f"Dòng chi tiết {detail_id} đã bị từ chối ngoại lệ FEFO"
                        )

                    if exception["status"] != "APPROVED":
                        raise HTTPException(
                            409,
                            "Trạng thái yêu cầu ngoại lệ không hợp lệ"
                        )

                    # Đảm bảo dữ liệu yêu cầu vẫn khớp chi tiết phiếu
                    if (
                        int(exception["product_id"]) != int(product_id)
                        or int(exception["requested_qty"]) != requested_qty
                    ):
                        raise HTTPException(
                            409,
                            "Thông tin yêu cầu ngoại lệ không còn khớp chi tiết phiếu xuất"
                        )

                    # 4. Xuất đúng cost lot đã được duyệt
                    cursor.execute(
                        """
                        SELECT
                            cl.id AS cost_lot_id,
                            cl.batch_id,
                            cl.unit_cost,
                            cl.remaining_qty,
                            b.current_qty,
                            b.expiry_date
                        FROM batch_cost_lots cl
                        JOIN batches b ON b.id = cl.batch_id
                        WHERE cl.id = %s
                          AND b.id = %s
                          AND b.product_id = %s
                        FOR UPDATE
                        """,
                        (
                            exception["requested_cost_lot_id"],
                            exception["requested_batch_id"],
                            product_id
                        )
                    )
                    lot = cursor.fetchone()

                    if not lot:
                        raise HTTPException(
                            409,
                            "Cost lot đã duyệt không còn hợp lệ"
                        )

                    if lot["expiry_date"] < today:
                        raise HTTPException(
                            409,
                            "Cost lot đã hết hạn, không thể xuất"
                        )

                    if (
                        int(lot["remaining_qty"]) < requested_qty
                        or int(lot["current_qty"]) < requested_qty
                    ):
                        raise HTTPException(
                            409,
                            "Tồn kho cost lot đã thay đổi, không đủ số lượng xuất"
                        )

                    unit_cost = Decimal(str(lot["unit_cost"]))
                    total_cost = unit_cost * requested_qty

                    cursor.execute(
                        """
                        UPDATE batch_cost_lots
                        SET remaining_qty = remaining_qty - %s
                        WHERE id = %s
                          AND remaining_qty >= %s
                        """,
                        (
                            requested_qty,
                            lot["cost_lot_id"],
                            requested_qty
                        )
                    )

                    if cursor.rowcount != 1:
                        raise HTTPException(
                            409,
                            "Tồn cost lot vừa thay đổi, vui lòng thử lại"
                        )

                    cursor.execute(
                        """
                        UPDATE batches
                        SET current_qty = current_qty - %s
                        WHERE id = %s
                          AND current_qty >= %s
                        """,
                        (
                            requested_qty,
                            lot["batch_id"],
                            requested_qty
                        )
                    )

                    if cursor.rowcount != 1:
                        raise HTTPException(
                            409,
                            "Tồn kho batch vừa thay đổi, vui lòng thử lại"
                        )

                    cursor.execute(
                        """
                        UPDATE goods_issue_details
                        SET batch_id = %s,
                            cost_lot_id = %s,
                            unit_cost = %s,
                            total_cost = %s
                        WHERE detail_id = %s
                        """,
                        (
                            lot["batch_id"],
                            lot["cost_lot_id"],
                            unit_cost,
                            total_cost,
                            detail_id
                        )
                    )

                else:
                    # 5. Không có ngoại lệ: xuất theo FEFO mặc định
                    cursor.execute(
                        """
                        SELECT
                            cl.id AS cost_lot_id,
                            cl.batch_id,
                            cl.unit_cost,
                            cl.remaining_qty,
                            b.expiry_date,
                            b.batch_number,
                            b.current_qty
                        FROM batch_cost_lots cl
                        JOIN batches b ON b.id = cl.batch_id
                        WHERE b.product_id = %s
                          AND cl.remaining_qty > 0
                          AND b.current_qty > 0
                          AND b.expiry_date >= %s
                        ORDER BY
                            b.expiry_date ASC,
                            b.import_date ASC,
                            cl.id ASC
                        FOR UPDATE
                        """,
                        (product_id, today)
                    )
                    lots = cursor.fetchall()

                    available = sum(
                        int(lot["remaining_qty"])
                        for lot in lots
                    )

                    if available < requested_qty:
                        raise HTTPException(
                            400,
                            f"Sản phẩm ID {product_id} chỉ còn {available} "
                            f"đơn vị có cost lot hợp lệ; cần {requested_qty}."
                        )

                    qty_left = requested_qty
                    first_allocation = True

                    for lot in lots:
                        if qty_left <= 0:
                            break

                        take_qty = min(
                            qty_left,
                            int(lot["remaining_qty"])
                        )

                        unit_cost = Decimal(str(lot["unit_cost"]))
                        total_cost = unit_cost * take_qty

                        cursor.execute(
                            """
                            UPDATE batch_cost_lots
                            SET remaining_qty = remaining_qty - %s
                            WHERE id = %s
                              AND remaining_qty >= %s
                            """,
                            (
                                take_qty,
                                lot["cost_lot_id"],
                                take_qty
                            )
                        )

                        if cursor.rowcount != 1:
                            raise HTTPException(
                                409,
                                "Tồn cost lot vừa thay đổi, vui lòng thử lại"
                            )

                        cursor.execute(
                            """
                            UPDATE batches
                            SET current_qty = current_qty - %s
                            WHERE id = %s
                              AND current_qty >= %s
                            """,
                            (
                                take_qty,
                                lot["batch_id"],
                                take_qty
                            )
                        )

                        if cursor.rowcount != 1:
                            raise HTTPException(
                                409,
                                "Tồn kho batch vừa thay đổi, vui lòng thử lại"
                            )

                        if first_allocation:
                            cursor.execute(
                                """
                                UPDATE goods_issue_details
                                SET batch_id = %s,
                                    cost_lot_id = %s,
                                    quantity = %s,
                                    unit_cost = %s,
                                    total_cost = %s
                                WHERE detail_id = %s
                                """,
                                (
                                    lot["batch_id"],
                                    lot["cost_lot_id"],
                                    take_qty,
                                    unit_cost,
                                    total_cost,
                                    detail_id
                                )
                            )

                            first_allocation = False

                        else:
                            cursor.execute(
                                """
                                INSERT INTO goods_issue_details
                                (
                                    issue_id,
                                    product_id,
                                    batch_id,
                                    quantity,
                                    cost_lot_id,
                                    unit_cost,
                                    total_cost
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                                """,
                                (
                                    issue_id,
                                    product_id,
                                    lot["batch_id"],
                                    take_qty,
                                    lot["cost_lot_id"],
                                    unit_cost,
                                    total_cost
                                )
                            )

                        qty_left -= take_qty

                    if qty_left > 0:
                        raise HTTPException(
                            409,
                            "Không thể phân bổ đủ số lượng theo FEFO"
                        )

            # 6. Chỉ xác nhận phiếu sau khi tất cả dòng đã xử lý thành công
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

        return {
            "message": "Xác nhận phiếu xuất thành công",
            "issue_id": issue_id,
            "status": "CONFIRMED"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            500,
            f"Lỗi xác nhận phiếu xuất: {str(exc)}"
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
                    d.detail_id, d.product_id, d.batch_id, d.cost_lot_id,
                    d.quantity, d.unit_cost, d.total_cost,
                    b.batch_number, b.expiry_date,
                    p.name AS product_name, p.sku
                FROM goods_issue_details d
                LEFT JOIN batches b ON b.id = d.batch_id
                JOIN products p ON p.id = COALESCE(d.product_id, b.product_id)
                WHERE d.issue_id = %s
                ORDER BY d.detail_id
                """,
                (issue_id,)
            )
            issue["details"] = cursor.fetchall()
            return issue
    finally:
        conn.close()
@app.get("/api/v1/fefo-exceptions")
def get_fefo_exceptions(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    r.id,
                    r.issue_id,
                    i.issue_code,
                    r.detail_id,
                    r.product_id,
                    p.sku,
                    p.name AS product_name,
                    r.suggested_batch_id,
                    sb.batch_number AS suggested_batch_number,
                    r.requested_batch_id,
                    rb.batch_number AS requested_batch_number,
                    r.requested_cost_lot_id,
                    r.requested_qty,
                    r.reason,
                    r.status,
                    r.requested_by,
                    requester.username AS requested_by_name,
                    r.reviewed_by,
                    reviewer.username AS reviewed_by_name,
                    r.review_note,
                    r.requested_at,
                    r.reviewed_at
                FROM fefo_exception_requests r
                JOIN goods_issues i ON i.issue_id = r.issue_id
                JOIN products p ON p.id = r.product_id
                LEFT JOIN batches sb ON sb.id = r.suggested_batch_id
                JOIN batches rb ON rb.id = r.requested_batch_id
                LEFT JOIN users requester ON requester.id = r.requested_by
                LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
            """

            params = []

            if status_filter:
                allowed_statuses = ["PENDING", "APPROVED", "REJECTED"]

                if status_filter not in allowed_statuses:
                    raise HTTPException(
                        400,
                        "Trạng thái lọc không hợp lệ"
                    )

                sql += " WHERE r.status = %s"
                params.append(status_filter)

            sql += " ORDER BY r.requested_at DESC, r.id DESC"

            cursor.execute(sql, params)
            return cursor.fetchall()

    finally:
        conn.close()
@app.post("/api/v1/fefo-exceptions/{request_id}/approve")
def approve_fefo_exception(
    request_id: int,
    data: FefoExceptionReview,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM fefo_exception_requests
                WHERE id = %s
                FOR UPDATE
                """,
                (request_id,)
            )
            request = cursor.fetchone()

            if not request:
                raise HTTPException(404, "Không tìm thấy yêu cầu ngoại lệ")

            if request["status"] != "PENDING":
                raise HTTPException(
                    409,
                    "Yêu cầu này đã được xử lý"
                )

            # Khóa phiếu xuất và kiểm tra còn là DRAFT
            cursor.execute(
                """
                SELECT status
                FROM goods_issues
                WHERE issue_id = %s
                FOR UPDATE
                """,
                (request["issue_id"],)
            )
            issue = cursor.fetchone()

            if not issue or issue["status"] != "DRAFT":
                raise HTTPException(
                    409,
                    "Phiếu xuất không còn ở trạng thái DRAFT"
                )

            # Kiểm tra chi tiết phiếu xuất
            cursor.execute(
                """
                SELECT detail_id, product_id, quantity
                FROM goods_issue_details
                WHERE detail_id = %s AND issue_id = %s
                FOR UPDATE
                """,
                (request["detail_id"], request["issue_id"])
            )
            detail = cursor.fetchone()

            if (
                not detail
                or detail["product_id"] != request["product_id"]
                or detail["quantity"] != request["requested_qty"]
            ):
                raise HTTPException(
                    409,
                    "Chi tiết phiếu xuất không còn khớp với yêu cầu"
                )

            # Kiểm tra cost lot và batch tại thời điểm duyệt
            cursor.execute(
                """
                SELECT
                    cl.id,
                    cl.batch_id,
                    cl.remaining_qty,
                    b.product_id,
                    b.current_qty,
                    b.expiry_date
                FROM batch_cost_lots cl
                JOIN batches b ON b.id = cl.batch_id
                WHERE cl.id = %s
                  AND b.id = %s
                  AND b.product_id = %s
                FOR UPDATE
                """,
                (
                    request["requested_cost_lot_id"],
                    request["requested_batch_id"],
                    request["product_id"]
                )
            )
            lot = cursor.fetchone()

            if not lot:
                raise HTTPException(
                    404,
                    "Cost lot hoặc batch không còn hợp lệ"
                )

            if lot["expiry_date"] < date.today():
                raise HTTPException(
                    409,
                    "Lô hàng đã hết hạn, không thể duyệt"
                )

            if (
                lot["remaining_qty"] < request["requested_qty"]
                or lot["current_qty"] < request["requested_qty"]
            ):
                raise HTTPException(
                    409,
                    "Tồn kho không đủ để duyệt yêu cầu"
                )

            cursor.execute(
                """
                UPDATE fefo_exception_requests
                SET status = 'APPROVED',
                    reviewed_by = %s,
                    review_note = %s,
                    reviewed_at = NOW()
                WHERE id = %s AND status = 'PENDING'
                """,
                (
                    int(current_user["sub"]),
                    data.review_note,
                    request_id
                )
            )

            if cursor.rowcount != 1:
                raise HTTPException(
                    409,
                    "Yêu cầu vừa được người khác xử lý"
                )

        conn.commit()

        return {
            "message": "Duyệt yêu cầu ngoại lệ FEFO thành công",
            "request_id": request_id,
            "status": "APPROVED",
            "note": "Tồn kho chưa bị trừ. Tồn sẽ được cập nhật khi xác nhận phiếu xuất."
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            500,
            f"Lỗi duyệt yêu cầu: {str(exc)}"
        ) from exc
    finally:
        conn.close()


@app.post("/api/v1/fefo-exceptions/{request_id}/reject")
def reject_fefo_exception(
    request_id: int,
    data: FefoExceptionReview,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, status
                FROM fefo_exception_requests
                WHERE id = %s
                FOR UPDATE
                """,
                (request_id,)
            )
            request = cursor.fetchone()

            if not request:
                raise HTTPException(404, "Không tìm thấy yêu cầu ngoại lệ")

            if request["status"] != "PENDING":
                raise HTTPException(
                    409,
                    "Yêu cầu này đã được xử lý"
                )

            cursor.execute(
                """
                UPDATE fefo_exception_requests
                SET status = 'REJECTED',
                    reviewed_by = %s,
                    review_note = %s,
                    reviewed_at = NOW()
                WHERE id = %s AND status = 'PENDING'
                """,
                (
                    int(current_user["sub"]),
                    data.review_note,
                    request_id
                )
            )

            if cursor.rowcount != 1:
                raise HTTPException(
                    409,
                    "Yêu cầu vừa được người khác xử lý"
                )

        conn.commit()

        return {
            "message": "Từ chối yêu cầu ngoại lệ FEFO thành công",
            "request_id": request_id,
            "status": "REJECTED"
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            500,
            f"Lỗi từ chối yêu cầu: {str(exc)}"
        ) from exc
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

@app.get("/api/v1/products/{product_id}/issueable-cost-lots")
def get_issueable_cost_lots(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            # Kiểm tra sản phẩm tồn tại
            cursor.execute(
                "SELECT id FROM products WHERE id = %s",
                (product_id,)
            )
            product = cursor.fetchone()

            if not product:
                raise HTTPException(404, "Không tìm thấy sản phẩm")

            # Lấy các cost lot còn hàng, chưa hết hạn
            cursor.execute(
                """
                SELECT
                    cl.id AS cost_lot_id,
                    cl.batch_id,
                    cl.unit_cost,
                    cl.received_qty,
                    cl.remaining_qty,
                    b.batch_number,
                    b.import_date,
                    b.expiry_date,
                    b.current_qty
                FROM batch_cost_lots cl
                JOIN batches b ON b.id = cl.batch_id
                WHERE b.product_id = %s
                  AND cl.remaining_qty > 0
                  AND b.current_qty > 0
                  AND b.expiry_date >= CURDATE()
                ORDER BY
                    b.expiry_date ASC,
                    b.import_date ASC,
                    cl.id ASC
                """,
                (product_id,)
            )

            lots = cursor.fetchall()

            return {
                "product_id": product_id,
                "lots": lots
            }

    finally:
        conn.close()
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
def create_batch(
    batch: BatchCreate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    raise HTTPException(
        status_code=409,
        detail=(
            "Không được tạo lô hàng trực tiếp. "
            "Vui lòng tạo phiếu nhập và xác nhận phiếu nhập "
            "để hệ thống tự động cập nhật tồn kho và giá vốn FEFO."
        )
    )
class BatchUpdate(BaseModel):
    batch_number: str
    expiry_date: str
    current_qty: int


@app.put("/api/v1/batches/{batch_id}")
def update_batch(
    batch_id: int,
    batch: BatchUpdate,
    current_user: dict = Depends(
        require_roles("Admin", "Store Manager")
    )
):
    conn = get_db()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, current_qty
                FROM batches
                WHERE id = %s
                FOR UPDATE
                """,
                (batch_id,)
            )

            existing_batch = cursor.fetchone()

            if not existing_batch:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy lô hàng"
                )

            if batch.current_qty != existing_batch["current_qty"]:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Không được sửa số lượng tồn trực tiếp. "
                        "Tồn kho phải được cập nhật thông qua "
                        "phiếu nhập hoặc phiếu xuất."
                    )
                )

            cursor.execute(
                """
                UPDATE batches
                SET batch_number = %s,
                    expiry_date = %s
                WHERE id = %s
                """,
                (
                    batch.batch_number,
                    batch.expiry_date,
                    batch_id
                )
            )

        conn.commit()

        return {
            "message": "Cập nhật thông tin lô hàng thành công"
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi cập nhật lô hàng: {str(exc)}"
        ) from exc
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