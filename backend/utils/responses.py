"""
Standardized API Response Utilities

Provides consistent response formatting with both snake_case and camelCase field aliases.
This ensures API compatibility with different client conventions.
"""

import re
from typing import Any, Dict, Generic, List, Optional, TypeVar, Union
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


T = TypeVar('T')


def to_camel_case(snake_str: str) -> str:
    """
    Convert snake_case to camelCase

    Examples:
        >>> to_camel_case('hello_world')
        'helloWorld'
        >>> to_camel_case('kp_index')
        'kpIndex'
    """
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    """
    Convert camelCase to snake_case

    Examples:
        >>> to_snake_case('helloWorld')
        'hello_world'
        >>> to_snake_case('kpIndex')
        'kp_index'
    """
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


class CamelCaseModel(BaseModel):
    """
    Base model that automatically provides both snake_case and camelCase fields.

    When serialized, the response includes both naming conventions:
    - Original snake_case fields
    - Aliased camelCase fields

    Usage:
        class MyModel(CamelCaseModel):
            user_name: str
            kp_index: float

        # Serializes to: {"user_name": "...", "userName": "...", "kp_index": 1.0, "kpIndex": 1.0}
    """
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )

    def model_dump_dual(self, **kwargs) -> Dict[str, Any]:
        """
        Dump model with both snake_case and camelCase fields.
        Returns a dictionary containing both naming conventions for each field.
        """
        # Get the snake_case version (by_alias=False)
        snake_dict = self.model_dump(by_alias=False, **kwargs)

        # Get the camelCase version (by_alias=True)
        camel_dict = self.model_dump(by_alias=True, **kwargs)

        # Merge both - snake_case fields with camelCase aliases added
        result = {}
        for key, value in snake_dict.items():
            # Add snake_case
            result[key] = value

            # Add camelCase alias if different
            camel_key = to_camel_case(key)
            if camel_key != key:
                result[camel_key] = value

        return result


def add_camel_case_aliases(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively add camelCase aliases to a dictionary with snake_case keys.

    Args:
        data: Dictionary with snake_case keys

    Returns:
        Dictionary with both snake_case and camelCase keys
    """
    if not isinstance(data, dict):
        return data

    result = {}
    for key, value in data.items():
        # Handle nested dictionaries
        if isinstance(value, dict):
            value = add_camel_case_aliases(value)
        # Handle lists of dictionaries
        elif isinstance(value, list):
            value = [
                add_camel_case_aliases(item) if isinstance(item, dict) else item
                for item in value
            ]

        # Add original snake_case key
        result[key] = value

        # Add camelCase alias if different
        camel_key = to_camel_case(key)
        if camel_key != key:
            result[camel_key] = value

    return result


class APIError(CamelCaseModel):
    """Standardized error details"""
    code: str = Field(description="Error code for programmatic handling")
    message: str = Field(description="Human-readable error message")
    field: Optional[str] = Field(default=None, description="Field that caused the error, if applicable")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")


class APIResponse(CamelCaseModel, Generic[T]):
    """
    Standardized API response wrapper.

    Provides consistent structure for all API responses with:
    - success: Boolean indicating operation success
    - data: The actual response payload (when successful)
    - error: Error details (when failed)
    - meta: Optional metadata (pagination, timestamps, etc.)

    All fields are available in both snake_case and camelCase.
    """
    success: bool = Field(description="Whether the operation was successful")
    data: Optional[T] = Field(default=None, description="Response payload")
    error: Optional[APIError] = Field(default=None, description="Error details if success=false")
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Response metadata")

    def model_dump_response(self, **kwargs) -> Dict[str, Any]:
        """
        Dump the response with dual-case support for nested data.
        """
        result = {
            "success": self.success,
        }

        if self.data is not None:
            if isinstance(self.data, dict):
                result["data"] = add_camel_case_aliases(self.data)
            elif isinstance(self.data, CamelCaseModel):
                result["data"] = self.data.model_dump_dual(**kwargs)
            elif isinstance(self.data, BaseModel):
                result["data"] = add_camel_case_aliases(self.data.model_dump(**kwargs))
            elif isinstance(self.data, list):
                result["data"] = [
                    add_camel_case_aliases(item.model_dump(**kwargs)) if isinstance(item, BaseModel)
                    else add_camel_case_aliases(item) if isinstance(item, dict)
                    else item
                    for item in self.data
                ]
            else:
                result["data"] = self.data

        if self.error is not None:
            result["error"] = self.error.model_dump_dual(**kwargs)

        if self.meta is not None:
            result["meta"] = add_camel_case_aliases(self.meta)

        return result


def create_response(
    data: Any,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a successful API response with dual-case support.

    Args:
        data: The response payload
        meta: Optional metadata

    Returns:
        Dictionary with standardized response structure
    """
    response = APIResponse(
        success=True,
        data=data,
        meta=meta
    )
    return response.model_dump_response()


def create_error_response(
    code: str,
    message: str,
    field: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create an error API response.

    Args:
        code: Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
        message: Human-readable error message
        field: Field that caused the error (optional)
        details: Additional error details (optional)
        meta: Response metadata (optional)

    Returns:
        Dictionary with standardized error response structure
    """
    error = APIError(
        code=code,
        message=message,
        field=field,
        details=details
    )
    response = APIResponse(
        success=False,
        error=error,
        meta=meta
    )
    return response.model_dump_response()


def success_response(
    data: Any,
    cached: bool = False,
    source: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function for creating successful responses.

    Args:
        data: Response payload (dict, list, or Pydantic model)
        cached: Whether data was served from cache
        source: Data source identifier (e.g., "noaa", "google_maps")

    Returns:
        Standardized response dictionary
    """
    meta = {
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "cached": cached,
    }
    if source:
        meta["source"] = source

    # Process the data
    if isinstance(data, BaseModel):
        processed_data = add_camel_case_aliases(data.model_dump())
    elif isinstance(data, dict):
        processed_data = add_camel_case_aliases(data)
    elif isinstance(data, list):
        processed_data = [
            add_camel_case_aliases(item.model_dump()) if isinstance(item, BaseModel)
            else add_camel_case_aliases(item) if isinstance(item, dict)
            else item
            for item in data
        ]
    else:
        processed_data = data

    return {
        "success": True,
        "data": processed_data,
        "meta": add_camel_case_aliases(meta)
    }


def error_response(
    code: str,
    message: str,
    status_code: int = 400,
    field: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Convenience function for creating error responses.

    Args:
        code: Error code
        message: Error message
        status_code: HTTP status code (for reference)
        field: Field that caused the error
        details: Additional details

    Returns:
        Standardized error response dictionary
    """
    error_data = {
        "code": code,
        "message": message,
    }
    if field:
        error_data["field"] = field
    if details:
        error_data["details"] = add_camel_case_aliases(details)

    return {
        "success": False,
        "error": error_data,
        "meta": add_camel_case_aliases({
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "status_code": status_code,
        })
    }


# Common error codes
class ErrorCodes:
    """Standard error codes for consistent error handling"""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    CACHE_ERROR = "CACHE_ERROR"
