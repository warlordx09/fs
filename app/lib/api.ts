const BASE = "http://ec2-13-201-115-54.ap-south-1.compute.amazonaws.com:5000/fs";

export const API = {
  get: async (path: string, params?: Record<string, string>) => {
    const url = new URL(BASE + path);

    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.append(k, v)
      );
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`GET ${url} failed: ${await res.text()}`);
    return res.json();
  },

  post: async (path: string, body?: any) => {

    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) throw new Error(`POST ${path} failed: ${await res.text()}`);
    return res.json();
  },

  put: async (path: string, body?: any) => {
    const res = await fetch(BASE + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) throw new Error(`PUT ${path} failed: ${await res.text()}`);
    return res.json();
  },

  delete: async (path: string, body?: any) => {
    const res = await fetch(BASE + path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) throw new Error(`DELETE ${path} failed: ${await res.text()}`);
    return res.json();
  },
};
