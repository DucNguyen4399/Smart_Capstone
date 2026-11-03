from database_mongo import mongo_client, mongo_db

try:
    print("MongoDB:", mongo_client.admin.command("ping"))
    print("Database:", mongo_db.name)
    print("Collections:", mongo_db.list_collection_names())
    print("Products:", mongo_db["San_pham"].count_documents({}))
finally:
    mongo_client.close()