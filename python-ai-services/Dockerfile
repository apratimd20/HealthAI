# Use an official Python 3.11 slim image (lightweight and fast)
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first (to cache dependencies for faster builds)
COPY requirements.txt .

# Install dependencies (This will run on YOUR machine first, so no Rust errors!)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run your FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]