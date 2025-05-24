const BASE_URL = "https://localhost:5001/api";

export const apiRoutes = {
  auth: {
    login: `${BASE_URL}/auth/login`,
    register: `${BASE_URL}/auth/register`,
  },
  room: {
    collaboration: (roomName: string) => `${BASE_URL}/room/collaboration/${roomName}`,
  },
  permission: {
    add: `${BASE_URL}/room/permission`,
    remove: `${BASE_URL}/room/permission`,
    edit: `${BASE_URL}/room/permission`,
    getByRoom: (roomId: string) => `${BASE_URL}/room/permission/${roomId}`,
  }
};