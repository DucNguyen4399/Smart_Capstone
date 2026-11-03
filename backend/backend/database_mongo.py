import os
from pymongo import MongoClient

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb://127.0.0.1:27017"
)

MONGODB_DATABASE = os.getenv(
    "MONGODB_DATABASE",
    "Chuoi_Ban_Le"
)

mongo_client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=5000,
)

mongo_db = mongo_client[MONGODB_DATABASE]

# Các collection phải trùng với tên trong MongoDB Compass
mongo_products = mongo_db["San_pham"]
mongo_categories = mongo_db["Danh_muc"]
mongo_brands = mongo_db["Thuong_hieu"]
mongo_units = mongo_db["Don_vi_tinh"]
mongo_batches = mongo_db["Lo_hang"]