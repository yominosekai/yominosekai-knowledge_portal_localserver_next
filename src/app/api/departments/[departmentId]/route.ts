import { NextRequest, NextResponse } from 'next/server';
import { getDepartment, updateDepartment, deleteDepartment } from '../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const department = await getDepartment(departmentId);
    
    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      department
    });
  } catch (error) {
    console.error('Department GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const body = await request.json();
    
    const result = await updateDepartment(departmentId, body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update department' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Department PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const result = await deleteDepartment(departmentId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete department' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Department DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
