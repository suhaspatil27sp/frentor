import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // Check database connectivity
    const dbHealthy = await db.healthCheck();
    
    if (!dbHealthy) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'AI Tutor Chat is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}