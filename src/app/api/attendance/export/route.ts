import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.timestamp = { gte: startOfDay, lte: endOfDay };
  }

  const logs = await prisma.attendanceLog.findMany({
    where,
    include: {
      student: {
        select: { name: true, studentId: true },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  const csvRows = [
    ["No", "NIM", "Nama", "Waktu", "Status"].join(","),
    ...logs.map((log, i) =>
      [
        i + 1,
        log.student.studentId,
        `"${log.student.name}"`,
        new Date(log.timestamp).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
        }),
        log.status,
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csvRows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rekap-kehadiran${date ? `-${date}` : ""}.csv"`,
    },
  });
}
