# Use Python 3.11 (stable, no Rust build errors)
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first (speeds up future builds)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your code
COPY . .

# Expose the port
EXPOSE 8000

# Command to start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]