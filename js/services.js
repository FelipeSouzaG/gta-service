const apiUrl = 'https://servergta.vercel.app';

export function ErrorBase(
  msg = 'Falha na conexão com servidor. Verifique a internet ou tente novamente.'
) {
  const error = new Error(msg);
  return error;
}

export const userSection = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/users/userdata`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataSection = await response.json();
    return dataSection;
  } catch (error) {
    throw ErrorBase();
  }
};

export const userLogoff = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/users/logoff`, {
      method: 'POST',
      credentials: 'include',
    });
    const dataLogoff = await response.json();
    return dataLogoff;
  } catch (error) {
    throw ErrorBase();
  }
};

export const userUpdate = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/users/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataUpdate = await response.json();
    return dataUpdate;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllUsers = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/users/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataUsers = await response.json();
    return dataUsers;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerClient = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/clients/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataClient = await response.json();
    return dataClient;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllClients = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/clients/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataClients = await response.json();
    return dataClients;
  } catch (error) {
    throw ErrorBase();
  }
};

export const allAddresses = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/api/addresses/all/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataAddressesUser = await response.json();
    return dataAddressesUser;
  } catch (error) {
    throw ErrorBase();
  }
};

export const getAddressOfficer = async (officerId) => {
  try {
    const response = await fetch(
      `${apiUrl}/api/addresses/officer/${officerId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const dataAddressesOfficer = await response.json();
    return dataAddressesOfficer;
  } catch (error) {
    throw ErrorBase();
  }
};

export const getAddressId = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/api/addresses/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    const addressId = await response.json();
    return addressId;
  } catch (error) {
    throw ErrorBase();
  }
};

export const createAddress = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/addresses/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const addressCliente = await response.json();
    return addressCliente;
  } catch (error) {
    throw ErrorBase();
  }
};

export const environmentAddressClient = async (addressId) => {
  try {
    const response = await fetch(
      `${apiUrl}/api/environments/client/${addressId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const dataEnvironment = await response.json();
    return dataEnvironment;
  } catch (error) {
    throw ErrorBase();
  }
};

export const createEnvironment = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/environments/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const envAddress = await response.json();
    return envAddress;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerOfficer = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/officers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataOfficer = await response.json();
    return dataOfficer;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllOfficers = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/officers/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataOfficers = await response.json();
    return dataOfficers;
  } catch (error) {
    throw ErrorBase();
  }
};

export const createService = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/services/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataService = await response.json();
    return dataService;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllService = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/services/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataServices = await response.json();
    return dataServices;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllRequest = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/requests/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataRequests = await response.json();
    return dataRequests;
  } catch (error) {
    throw ErrorBase();
  }
};

export const updateRequest = async (data, requestId) => {
  try {
    const response = await fetch(`${apiUrl}/api/requests/update/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataRequest = await response.json();
    return dataRequest;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerBudget = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/budgets/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataBudgets = await response.json();
    return dataBudgets;
  } catch (error) {
    throw ErrorBase();
  }
};

export const updateBudget = async (data, budgetId) => {
  try {
    const response = await fetch(`${apiUrl}/api/budgets/update/${budgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataBudget = await response.json();
    return dataBudget;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerOrder = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/orders/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataOrder = await response.json();
    return dataOrder;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerRequest = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/requests/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataRequest = await response.json();
    return dataRequest;
  } catch (error) {
    throw ErrorBase();
  }
};

export const listAllServiceOfficer = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/orders/officer/all`, {
      method: 'GET',
      credentials: 'include',
    });
    const dataOrdersOfficer = await response.json();
    return dataOrdersOfficer;
  } catch (error) {
    throw ErrorBase();
  }
};

export const registerHistory = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/api/historys/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const dataHistory = await response.json();
    return dataHistory;
  } catch (error) {
    throw ErrorBase();
  }
};

export const environmentAllServices = async (environmentId) => {
  try {
    const response = await fetch(
      `${apiUrl}/api/historys/all/${environmentId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const dataHistory = await response.json();
    return dataHistory;
  } catch (error) {
    throw ErrorBase();
  }
};
