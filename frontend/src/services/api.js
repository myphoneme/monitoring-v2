import axios from 'axios';

const API_BASE_URL = 'https://fastapi.phoneme.in/vm';

export const fetchVMData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching VM data:', error);
    throw error;
  }
};

export const fetchVMMasterData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/master_vms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching VM master data:', error);
    throw error;
  }
};

export const createVM = async (vmData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}create`, vmData);
    return response.data;
  } catch (error) {
    console.error('Error creating VM:', error);
    throw error;
  }
};

export const updateVM = async (vmId, vmData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/update/${vmId}`, vmData);
    return response.data;
  } catch (error) {
    console.error('Error updating VM:', error);
    throw error;
  }
};

export const deleteVM = async (vmId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${vmId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting VM:', error);
    throw error;
  }
};