import { NextRequest, NextResponse } from 'next/server';
import { getAllDepartments, createDepartment } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Departments GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createDepartment(body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create department' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Department POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



