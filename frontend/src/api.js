import axios from 'axios';

// API URL configuration
export const BACKEND_URL = "https://9fa6a152-5e96-448d-a89b-d3e858a0d36a.preview.emergentagent.com";
export const API = `${BACKEND_URL}/api`;

// Configure axios globally
axios.defaults.baseURL = BACKEND_URL;

// Add axios request interceptor to ensure HTTPS
axios.interceptors.request.use((config) => {
  // Ensure all URLs start with https://
  if (config.url && config.url.startsWith('http:')) {
    config.url = config.url.replace('http:', 'https:');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await axios.post(`${API}/auth/token`, new URLSearchParams({
      'username': email,
      'password': password
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },
  
  getUserInfo: async () => {
    return axios.get(`${API}/users/me`);
  }
};

// Suppliers API
export const suppliersAPI = {
  getAll: async () => {
    return axios.get(`${API}/suppliers`);
  },
  
  getById: async (id) => {
    return axios.get(`${API}/suppliers/${id}`);
  },
  
  create: async (data) => {
    return axios.post(`${API}/suppliers`, data);
  },
  
  update: async (id, data) => {
    return axios.put(`${API}/suppliers/${id}`, data);
  }
};

// Contracts API
export const contractsAPI = {
  getAll: async () => {
    return axios.get(`${API}/contracts`);
  },
  
  getById: async (id) => {
    return axios.get(`${API}/contracts/${id}`);
  },
  
  create: async (data) => {
    return axios.post(`${API}/contracts`, data);
  },
  
  generate: async (id) => {
    return axios.post(`${API}/contracts/${id}/generate`);
  },
  
  sign: async (id) => {
    return axios.post(`${API}/contracts/${id}/sign`);
  },
  
  download: async (id) => {
    window.open(`${API}/contracts/${id}/download`, '_blank');
  }
};

// Templates API
export const templatesAPI = {
  getAll: async () => {
    return axios.get(`${API}/templates`);
  },
  
  upload: async (formData) => {
    return axios.post(`${API}/templates`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }
};

// General Conditions API
export const generalConditionsAPI = {
  getActive: async () => {
    return axios.get(`${API}/general-conditions/active`);
  },
  
  create: async (data) => {
    return axios.post(`${API}/general-conditions`, data);
  }
};

// Configure auth header when token exists
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};
