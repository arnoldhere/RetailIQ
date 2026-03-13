from fastapi import FastAPI, HTTPException

app = FastAPI()


# check connection
@app.get("/")
def health_check():
    return {"message": "FastAPI started..."}

def