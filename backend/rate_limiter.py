# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from slowapi import Limiter
from slowapi.util import get_remote_address
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

# Setup slowapi rate limiter with remote IP addresses
limiter = Limiter(key_func=get_remote_address)

# Rate limit tiers defined as constants for easy routing decorators
READ_LIMIT = "100/minute"
WRITE_LIMIT = "20/minute"
REMEDIATE_LIMIT = "5/minute"
