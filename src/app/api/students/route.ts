import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      studentId: true,
      faceDescriptor: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, studentId, faceDescriptor } = body;

  if (!name || !studentId || !faceDescriptor) {
    return NextResponse.json(
      { error: "Nama, NIM, dan deskriptor wajah harus diisi" },
      { status: 400 }
    );
  }

  const existing = await prisma.student.findUnique({
    where: { studentId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "NIM sudah terdaftar" },
      { status: 409 }
    );
  }

  const student = await prisma.student.create({
    data: {
      name,
      studentId,
      faceDescriptor: JSON.stringify(faceDescriptor),
    },
  });

  return NextResponse.json(student, { status: 201 });
}
