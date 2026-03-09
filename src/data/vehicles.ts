export type VehicleOption = {
  id: string;
  name: string;
  code: string;
  warranty: string;
  image: string;
};

export const vehicles: VehicleOption[] = [
  {
    id: "golf",
    name: "รถกอล์ฟ-รถรับส่งผู้โดยสารไฟฟ้า",
    code: "GOLF",
    warranty:
      "ประกันสินค้า 1 ปี (แบตเตอรี่/มอเตอร์/ตัวถัง) ข้อมูลรายละเอียดของรถนะ",
    image: "/รถกอล์ฟ-รถรับส่งผู้โดยสารไฟฟ้า/675705.jpg",
  },
  {
    id: "j50",
    name: "รถสามล้อไฟฟ้า แบบมีหลังคา รุ่น J50",
    code: "J50",
    warranty:
      "ประกันสินค้า 1 ปี (แบตเตอรี่/มอเตอร์/ตัวถัง) ข้อมูลรายละเอียดของรถนะ",
    image: "/รถสามล้อไฟฟ้า แบบมีหลังคา รุ่น J50/677511.jpg",
  },
  {
    id: "t1-6",
    name: "รถสามล้อไฟฟ้า แบบมีหลังคากระบะตู้ทึบ รุ่น T1.6",
    code: "T1.6",
    warranty:
      "ประกันสินค้า 1 ปี (แบตเตอรี่/มอเตอร์/ตัวถัง) ข้อมูลรายละเอียดของรถนะ",
    image: "/รถสามล้อไฟฟ้า แบบมีหลังคากระบะตู้ทึบ รุ่น T1.6/677480.jpg",
  },
  {
    id: "gt-1",
    name: "รถสี่ล้อไฟฟ้าโบราณ แบบมีหลังคา รุ่น GT-1",
    code: "GT-1",
    warranty:
      "ประกันสินค้า 1 ปี (แบตเตอรี่/มอเตอร์/ตัวถัง) ข้อมูลรายละเอียดของรถนะ",
    image: "/รถสี่ล้อไฟฟ้าโบราณ แบบมีหลังคา รุ่น GT-1/677474.jpg",
  },
];

export function getVehicleById(id?: string) {
  if (!id) {
    return undefined;
  }
  return vehicles.find((vehicle) => vehicle.id === id);
}
