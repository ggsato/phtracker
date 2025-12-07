import os
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr, Key

TABLE_NAME = os.getenv("TABLE_NAME", "phtracker-dev")
REGION = os.getenv("AWS_REGION") or os.getenv("REGION") or "us-east-1"
ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT")

_dynamodb = boto3.resource("dynamodb", region_name=REGION, endpoint_url=ENDPOINT_URL)
_table = _dynamodb.Table(TABLE_NAME)


def _to_decimal(value: Any) -> Any:
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, list):
        return [_to_decimal(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_decimal(v) for k, v in value.items()}
    return value


def _from_decimal(value: Any) -> Any:
    if isinstance(value, list):
        return [_from_decimal(v) for v in value]
    if isinstance(value, dict):
        return {k: _from_decimal(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        return float(value)
    return value


def _pk(user_id: str) -> str:
    return f"USER#{user_id}"


def _profile_sk(profile_id: str) -> str:
    return f"PROFILE#{profile_id}"


def _phlog_sk(profile_id: str, date: str) -> str:
    return f"PHLOG#{profile_id}#{date}"


def list_profiles(user_id: str) -> List[Dict[str, Any]]:
    resp = _table.query(
        KeyConditionExpression=Key("PK").eq(_pk(user_id))
        & Key("SK").begins_with("PROFILE#")
    )
    items = resp.get("Items", [])
    return [_from_decimal(item) for item in items]


def create_profile(user_id: str, display_name: str) -> Dict[str, Any]:
    profile_id = str(uuid.uuid4())
    item = {
        "PK": _pk(user_id),
        "SK": _profile_sk(profile_id),
        "ItemType": "PROFILE",
        "profile_id": profile_id,
        "display_name": display_name,
    }
    _table.put_item(Item=item)
    return item


def save_ph_log(
    user_id: str,
    profile_id: str,
    date: str,
    ph_value: float,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    item = {
        "PK": _pk(user_id),
        "SK": _phlog_sk(profile_id, date),
        "ItemType": "PHLOG",
        "profile_id": profile_id,
        "date": date,
        "ph": _to_decimal(ph_value),
    }
    if notes:
        item["notes"] = notes
    _table.put_item(Item=item)
    return _from_decimal(item)


def query_ph_logs(
    user_id: str,
    profile_id: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> List[Dict[str, Any]]:
    key_expr = Key("PK").eq(_pk(user_id)) & Key("SK").begins_with(f"PHLOG#{profile_id}#")

    if start and end:
        key_expr = Key("PK").eq(_pk(user_id)) & Key("SK").between(
            _phlog_sk(profile_id, start), _phlog_sk(profile_id, end)
        )
    elif start:
        key_expr = Key("PK").eq(_pk(user_id)) & Key("SK").gte(
            _phlog_sk(profile_id, start)
        )
    elif end:
        key_expr = Key("PK").eq(_pk(user_id)) & Key("SK").lte(
            _phlog_sk(profile_id, end)
        )

    resp = _table.query(KeyConditionExpression=key_expr)
    return [_from_decimal(item) for item in resp.get("Items", [])]


def search_foods(
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_pral: Optional[float] = None,
    max_pral: Optional[float] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    filters = [Attr("ItemType").eq("FOOD")]

    if query:
        filters.append(Attr("name").contains(query))
    if category:
        filters.append(Attr("category").eq(category))
    if min_pral is not None:
        filters.append(Attr("pral").gte(_to_decimal(min_pral)))
    if max_pral is not None:
        filters.append(Attr("pral").lte(_to_decimal(max_pral)))

    filter_expr = None
    for f in filters:
        filter_expr = f if filter_expr is None else filter_expr & f

    resp = _table.scan(FilterExpression=filter_expr, Limit=limit)
    return [_from_decimal(item) for item in resp.get("Items", [])]
