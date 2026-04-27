import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeError(error) {
  return error.response?.data?.message || error.message || 'Something went wrong.';
}

export const authApi = {
  async register(payload) {
    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async login(payload) {
    try {
      const { data } = await api.post('/auth/login', payload);
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async me(token) {
    try {
      const { data } = await api.get('/auth/me', { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export const institutionApi = {
  async register(payload, token) {
    try {
      const { data } = await api.post('/institutions/register', payload, { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async list(token) {
    try {
      const { data } = await api.get('/institutions', { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async approve(id, token) {
    try {
      const { data } = await api.patch(`/institutions/${id}/approve`, {}, { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async reject(id, token) {
    try {
      const { data } = await api.patch(`/institutions/${id}/reject`, {}, { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export const credentialApi = {
  async my(token) {
    try {
      const { data } = await api.get('/credentials/my', { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async issued(token) {
    try {
      const { data } = await api.get('/credentials/issued', { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async issue(payload, token) {
    try {
      const { data } = await api.post('/credentials/issue', payload, { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async revoke(id, token) {
    try {
      const { data } = await api.patch(`/credentials/${id}/revoke`, {}, { headers: authHeader(token) });
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export const verifyApi = {
  async getByTokenId(tokenId) {
    try {
      const { data } = await api.get(`/verify/${tokenId}`);
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export const blockchainApi = {
  async listTransactions() {
    try {
      const { data } = await api.get('/blockchain/transactions');
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
  async getTransaction(txHash) {
    try {
      const { data } = await api.get(`/blockchain/transactions/${txHash}`);
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export const healthApi = {
  async status() {
    try {
      const { data } = await api.get('/health');
      return data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};
