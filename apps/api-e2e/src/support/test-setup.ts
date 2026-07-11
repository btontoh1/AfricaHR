import axios from 'axios';
import { apiBaseUrl } from './base-url';

module.exports = async function() {
  axios.defaults.baseURL = apiBaseUrl();
};
