import { NextResponse } from 'next/server';

export function successResponse(data: any, statusCode = 200) {
  return NextResponse.json(
    {
      status: 'success',
      data,
    },
    { status: statusCode }
  );
}

export function errorResponse(code: string, message: string, statusCode = 400, details?: any) {
  return NextResponse.json(
    {
      status: 'error',
      error: {
        code,
        message,
        details,
      },
    },
    { status: statusCode }
  );
}
