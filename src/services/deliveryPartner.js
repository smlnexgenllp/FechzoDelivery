import api from "../api/axios";

export const checkDeliveryPartner = async (phone) => {
  const res = await api.post("/delivery-partner/check", { phone });
  return res.data;
};
