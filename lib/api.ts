const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type ApiResponse<T = any> = {
  status: "success" | "error";
  message?: string;
  [key: string]: any;
} & T;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("easyservice_token");
}

export function setToken(token: string) {
  localStorage.setItem("easyservice_token", token);
}

export function clearToken() {
  localStorage.removeItem("easyservice_token");
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    // Any authenticated request failing with 401 means there's no valid
    // session — redirect to login from here, the one place ALL API calls
    // pass through, rather than relying on every page to notice and handle
    // it individually (which is exactly what was silently failing before:
    // pages caught the error, rendered with no data, and looked broken
    // instead of bouncing to /login). Skip this for the login endpoint
    // itself — a wrong password there should show an error, not redirect.
    if (res.status === 401 && path !== "/login" && typeof window !== "undefined") {
      clearToken();
      window.location.href = "/login";
    }
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request("/logout", { method: "POST" }),

  me: () => request("/me"),

  // Currencies
  getCurrencies: () => request("/currencies"),
  createCurrency: (payload: Record<string, any>) =>
    request("/currencies", { method: "POST", body: JSON.stringify(payload) }),
  updateCurrency: (id: number, payload: Record<string, any>) =>
    request(`/currencies/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCurrency: (id: number) =>
    request(`/currencies/${id}`, { method: "DELETE" }),

  // Currency groups (pair rates)
  getCurrencyGroups: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/currency-groups${qs}`);
  },
  createCurrencyGroup: (payload: Record<string, any>) =>
    request("/currency-groups", { method: "POST", body: JSON.stringify(payload) }),
  updateCurrencyGroup: (id: number, payload: Record<string, any>) =>
    request(`/currency-groups/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCurrencyGroup: (id: number) =>
    request(`/currency-groups/${id}`, { method: "DELETE" }),

  // Customers
  getRecentCustomers: () => request("/customers/recent"),
  getCustomers: (search?: string, extraParams?: Record<string, string>) => {
    const params: Record<string, string> = { ...(extraParams || {}) };
    if (search) params.search = search;
    const qs = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/customers${qs}`);
  },
  getCustomer: (id: number) => request(`/customers/${id}`),
  createCustomer: (payload: Record<string, any>) =>
    request("/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id: number, payload: Record<string, any>) =>
    request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deactivateCustomer: (id: number) =>
    request(`/customers/${id}`, { method: "DELETE" }),

  // Customer wallets
  getCustomerWallets: (customerId: number) =>
    request(`/customers/${customerId}/wallets`),
  fundCustomerWallet: (customerId: number, payload: Record<string, any>) =>
    request(`/customers/${customerId}/wallets/fund`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  expenseCustomerWallet: (customerId: number, payload: Record<string, any>) =>
    request(`/customers/${customerId}/wallets/expense`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addCustomerWallet: (customerId: number, currencyId: number) =>
    request(`/customers/${customerId}/wallets/add`, {
      method: "POST",
      body: JSON.stringify({ currency_id: currencyId }),
    }),
  reverseFunding: (paymentId: number) =>
    request(`/payments/${paymentId}/reverse-funding`, { method: "POST" }),
  reverseExpense: (paymentId: number) =>
    request(`/payments/${paymentId}/reverse-expense`, { method: "POST" }),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/transactions${qs}`);
  },
  getTransaction: (id: number) => request(`/transactions/${id}`),
  createTransaction: (payload: Record<string, any>) =>
    request("/transactions", { method: "POST", body: JSON.stringify(payload) }),
  completeTransaction: (id: number) =>
    request(`/transactions/${id}/complete`, { method: "POST" }),
  recordPayout: (id: number, payload: Record<string, any>) =>
    request(`/transactions/${id}/payout`, { method: "POST", body: JSON.stringify(payload) }),

  // Staff wallets & transfers
  getStaff: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/staff${qs}`);
  },
  fundStaffWallet: (userId: number, payload: Record<string, any>) =>
    request(`/staff/${userId}/fund`, { method: "POST", body: JSON.stringify(payload) }),
  getStaffStatements: (userId: number, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/staff/${userId}/statements${qs}`);
  },
  getStaffTransfers: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/staff-transfers${qs}`);
  },
  createStaffTransfer: (payload: Record<string, any>) =>
    request("/staff-transfers", { method: "POST", body: JSON.stringify(payload) }),

  // Transaction payments & refunds
  getTransactionPayments: (transactionId: number) =>
    request(`/transactions/${transactionId}/payments`),
  addTransactionPayment: (transactionId: number, payload: Record<string, any>) =>
    request(`/transactions/${transactionId}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRefunds: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/refunds${qs}`);
  },
  createRefund: (transactionId: number, payload: Record<string, any>) =>
    request(`/transactions/${transactionId}/refund`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  completeRefund: (id: number) => request(`/refunds/${id}/complete`, { method: "POST" }),

  // Reports
  getReportSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/reports/summary${qs}`);
  },
  getExpenseReport: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/reports/expenses${qs}`);
  },
  getTransferReport: () => request(`/reports/transfers`),
  getCustomerMonthlyReport: (customerId: number, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/reports/customer/${customerId}/monthly${qs}`);
  },
  async exportCustomerMonthlyPdf(customerId: number, params?: Record<string, string>): Promise<Blob> {
    const token = getToken();
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${API_URL}/reports/customer/${customerId}/monthly-pdf${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Could not generate the report PDF");
    return res.blob();
  },
  getCountrySummary: () => request(`/reports/country-summary`),
  getCashMovement: (params: Record<string, string>) => {
    const qs = `?${new URLSearchParams(params).toString()}`;
    return request(`/reports/cash-movement${qs}`);
  },
  async exportReportPdf(type: string, params?: Record<string, string>): Promise<Blob> {
    const token = getToken();
    const qs = new URLSearchParams({ type, ...(params || {}) }).toString();
    const res = await fetch(`${API_URL}/reports/export-pdf?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Could not generate the report PDF");
    return res.blob();
  },

  // Partner ledgers (Nita / Aliza / Sacko)
  getPartnerLedger: (partner: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/partner-ledger/${partner}${qs}`);
  },
  addPartnerLedgerEntry: (partner: string, payload: Record<string, any>) =>
    request(`/partner-ledger/${partner}`, { method: "POST", body: JSON.stringify(payload) }),

  // Public invoice tracking (no auth)
  trackInvoice: (ref: string) => request(`/track/${encodeURIComponent(ref)}`),

  // Expenses
  getExpenses: (status?: string) => request(`/expenses${status ? `?status=${status}` : ""}`),
  createExpense: (payload: Record<string, any>) =>
    request("/expenses", { method: "POST", body: JSON.stringify(payload) }),
  approveExpense: (id: number) => request(`/expenses/${id}/approve`, { method: "POST" }),
  deleteExpense: (id: number) => request(`/expenses/${id}`, { method: "DELETE" }),

  // Receipts are image-only — fetch JSON data, the receipt page renders + screenshots it.
  getReceiptData: (transactionId: number) => request(`/transactions/${transactionId}/receipt-data`),
  getPaymentReceiptData: (paymentId: number) => request(`/payments/${paymentId}/receipt-data`),

  // Special rates
  getSpecialRates: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/special-rates${qs}`);
  },
  createSpecialRate: (payload: Record<string, any>) =>
    request("/special-rates", { method: "POST", body: JSON.stringify(payload) }),
  deleteSpecialRate: (id: number) => request(`/special-rates/${id}`, { method: "DELETE" }),

  // Chad regions
  getChadRegions: (activeOnly?: boolean) => request(`/chad-regions${activeOnly ? "?active=1" : ""}`),
  createChadRegion: (region: string) =>
    request("/chad-regions", { method: "POST", body: JSON.stringify({ region }) }),
  updateChadRegion: (id: number, payload: Record<string, any>) =>
    request(`/chad-regions/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteChadRegion: (id: number) => request(`/chad-regions/${id}`, { method: "DELETE" }),

  // Staff / user management
  getRoles: () => request("/roles"),
  createStaff: (payload: Record<string, any>) =>
    request("/staff", { method: "POST", body: JSON.stringify(payload) }),
  getStaffFundHistory: () => request("/staff/fund-history"),
  async exportStaffStatementPdf(userId: number, params?: Record<string, string>): Promise<Blob> {
    const token = getToken();
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${API_URL}/staff/${userId}/statements-pdf${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Could not generate the statement PDF");
    return res.blob();
  },
  getCustomerFundingReport: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/reports/customer-funding${qs}`);
  },
  reverseStaffFund: (id: number) => request(`/staff/fund-history/${id}/reverse`, { method: "POST" }),
  getAccountStats: () => request("/account/stats"),
  updateStaff: (id: number, payload: Record<string, any>) =>
    request(`/staff/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  resetStaffPassword: (id: number, password: string) =>
    request(`/staff/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }),
  changeOwnPassword: (current_password: string, password: string) =>
    request("/change-password", { method: "POST", body: JSON.stringify({ current_password, password }) }),
  changeLanguage: (language: "en" | "ar") =>
    request("/change-language", { method: "POST", body: JSON.stringify({ language }) }),
  registerPushSubscription: (subscription: any) =>
    request("/push-subscriptions", { method: "POST", body: JSON.stringify(subscription) }),
  unregisterPushSubscription: (endpoint: string) =>
    request("/push-subscriptions", { method: "DELETE", body: JSON.stringify({ endpoint }) }),

  // Staff transfers — accept/reject workflow
  acceptStaffTransfer: (id: number) => request(`/staff-transfers/${id}/accept`, { method: "POST" }),
  rejectStaffTransfer: (id: number) => request(`/staff-transfers/${id}/reject`, { method: "POST" }),
  reverseStaffTransfer: (id: number) => request(`/staff-transfers/${id}/reverse`, { method: "POST" }),

  // Customer statement (transactions + wallets for one customer)
  getCustomerStatement: (customerId: number) => request(`/reports/customer/${customerId}`),

  // Payment evidence (multipart)
  getEvidence: (transactionId: number) => request(`/transactions/${transactionId}/evidence`),

  // Notifications
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id: number) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
  async uploadEvidence(transactionId: number, form: FormData) {
    const token = getToken();
    const res = await fetch(`${API_URL}/transactions/${transactionId}/evidence`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");
    return data;
  },
};
