import subprocess
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Get variables from .env
account = os.getenv("ACCOUNT")
sender = os.getenv("SENDER")

# Validate required values
if not account or not sender:
    raise ValueError("Missing ACCOUNT or SENDER in .env")

# Path to your script
script_path = "EthereumRouterScript"

# Forge command
cmd = [
    "forge", "script", script_path,
    "--rpc-url", "http://127.0.0.1:8545",
    "--broadcast",
    "--account", account,
    "--sender", sender
]

# Run it
try:
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    print("Script executed successfully:\n")
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print("Error running script:\n")
    print(e.stderr)
