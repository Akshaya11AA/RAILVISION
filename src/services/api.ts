import axios from 'axios';
export const api=axios.create({baseURL:'/api'});
export function setToken(t:string|null){if(t)api.defaults.headers.common.Authorization=`Bearer ${t}`;else delete api.defaults.headers.common.Authorization;}
