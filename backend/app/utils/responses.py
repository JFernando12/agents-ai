def success_response(data=None, message="Operation successful"):
    return {
        "status": "success",
        "message": message,
        "data": data
    }

def error_response(message="An error occurred", data=None):
    return {
        "status": "error",
        "message": message,
        "data": data
    }