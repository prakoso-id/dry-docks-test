import { request } from "./apiClient.js";

export async function listVessels() {
  return (await request("vessels")).data;
}

export async function createVessel(values) {
  return (await request("vessels", { method: "POST", body: values })).data;
}

export async function listShipyards() {
  return (await request("shipyards")).data;
}

export async function createShipyard(values) {
  return (await request("shipyards", { method: "POST", body: values })).data;
}

export async function listAccountCodes() {
  return (await request("account-codes")).data;
}

export async function listSpecificationGroups(vesselId) {
  return (await request(`specification-groups?vesselId=${encodeURIComponent(vesselId)}`)).data;
}

export async function createSpecificationGroup(values) {
  return (await request("specification-groups", { method: "POST", body: values })).data;
}
