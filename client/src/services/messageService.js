import API from './api';

export const messageService = {
  sendMessage: async (data) => {
    const res = await API.post('/messages', data);
    return res.data;
  },
  getConversations: async () => {
    const res = await API.get('/messages/conversations');
    return res.data;
  },
  getMessagesWithUser: async (userId) => {
    const res = await API.get(`/messages/user/${userId}`);
    return res.data;
  },
};
