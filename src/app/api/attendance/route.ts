import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.timestamp = { gte: startOfDay, lte: endOfDay };
  }

  const [logs, total] = await Promise.all([
    prisma.attendanceLog.findMany({
      where,
      include: {
        student: {
          select: { name: true, studentId: true },
        },
      },
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
    }),
    prisma.attendanceLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { studentId } = body;

  if (!studentId) {
    return NextResponse.json(
      { error: "Student ID diperlukan" },
      { status: 400 }
    );
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId },
  });

  if (!student) {
    return NextResponse.json(
      { error: "Mahasiswa tidak ditemukan" },
      { status: 404 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingLog = await prisma.attendanceLog.findFirst({
    where: {
      studentId: student.id,
      timestamp: { gte: today, lt: tomorrow },
    },
  });

  if (existingLog) {
    return NextResponse.json(
      { error: "Anda sudah absen hari ini", log: existingLog },
      { status: 409 }
    );
  }

  const log = await prisma.attendanceLog.create({
    data: {
      studentId: student.id,
      status: "Hadir",
    },
    include: {
      student: {
        select: { name: true, studentId: true },
      },
    },
  });

  return NextResponse.json(log, { status: 201 });
}
