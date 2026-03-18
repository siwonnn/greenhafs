"use server"

export interface AdminAuthResult {
  success: boolean
  error: string | null
}

export async function verifyAdminPassword(password: string): Promise<AdminAuthResult> {
  const configuredPassword = process.env.ADMIN_PAGE_PASSWORD

  if (!configuredPassword || configuredPassword.length === 0) {
    return {
      success: false,
      error: "ADMIN_PAGE_PASSWORD 환경변수가 설정되지 않았습니다.",
    }
  }

  if (password !== configuredPassword) {
    return {
      success: false,
      error: "비밀번호가 올바르지 않습니다.",
    }
  }

  return {
    success: true,
    error: null,
  }
}
