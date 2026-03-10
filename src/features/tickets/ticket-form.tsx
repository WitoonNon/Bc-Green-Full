"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { vehicles, type VehicleOption } from "@/data/vehicles";
import { createTicket } from "@/services/tickets";
import { getMockProfile } from "@/lib/user-profile";

const ticketSchema = z.object({
  repairDate: z.string().min(1, "Please select a date."),
  vehicleId: z.string().min(1, "Please select a vehicle."),
  description: z.string().min(5, "Please add more details."),
  customVehicle: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function TicketForm() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [addressReady, setAddressReady] = useState(false);
  const [addressChecked, setAddressChecked] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      repairDate: "",
      vehicleId: "",
      description: "",
      customVehicle: "",
    },
  });

  const selectedVehicleId = watch("vehicleId");

  // 🔄 Prevent Form Data Reset
  useEffect(() => {
    const saved = localStorage.getItem("ticketForm");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        reset(data);
      } catch (error) {
        console.error("Error loading saved form:", error);
        localStorage.removeItem("ticketForm");
      }
    }
  }, [reset]);

  const watched = watch();

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("ticketForm", JSON.stringify(watched));
    }, 500);
    return () => clearTimeout(timer);
  }, [watched]);

  // 📁 File Upload Enhancement with validation
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    // Validate file size (15MB limit)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 15 * 1024 * 1024) {
        showErrorAlert({
          title: lang === "th" ? "ไฟล์ใหญ่เกินไป" : "File too large",
          text: `${file.name} ${lang === "th" ? "ใหญ่เกิน 15MB" : "exceeds 15MB limit"}`
        });
        return false;
      }
      return true;
    });

    setFiles(validFiles);
  };

  // 🗑️ Delete File Function
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const imagePreviews = useMemo(() => {
    return files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
  }, [files]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setVehicleOptions(vehicles);
      return;
    }
    const firestore = db as Firestore;
    const vehicleQuery = query(
      collection(firestore, "vehicles"),
      orderBy("name", "asc"),
    );
    const unsubscribe = onSnapshot(vehicleQuery, (snapshot) => {
      const nextVehicles = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Partial<VehicleOption> & {
            published?: boolean;
          };
          if (data.published === false) {
            return null;
          }
          return {
            id: docSnap.id,
            name: String(data.name ?? ""),
            code: String(data.code ?? ""),
            warranty: String(data.warranty ?? ""),
            image: String(data.image ?? ""),
          };
        })
        .filter((item): item is VehicleOption => Boolean(item?.name));

      setVehicleOptions(nextVehicles.length > 0 ? nextVehicles : vehicles);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!vehicleOptions.length) {
      return;
    }
    const exists = vehicleOptions.some(
      (vehicle) => vehicle.id === selectedVehicleId,
    );
    if (!exists && selectedVehicleId && selectedVehicleId !== "other") {
      setValue("vehicleId", vehicleOptions[0].id, { shouldValidate: true });
    }
  }, [selectedVehicleId, setValue, vehicleOptions]);

  useEffect(() => {
    let cancelled = false;
    async function checkAddress() {
      if (!user) return;

      if (!db || !isFirebaseConfigured) {
        const mock = getMockProfile(user);
        const hasAddress =
          !!mock?.address &&
          [mock.address.line1, mock.address.district, mock.address.province, mock.address.zip].every(
            (value) => typeof value === "string" && value.trim().length > 0,
          );
        if (!cancelled) {
          setAddressReady(hasAddress);
          setAddressChecked(true);
        }
        return;
      }

      try {
        const firestore = db as Firestore;
        const snap = await getDoc(doc(firestore, "users", user.uid));
        const data = snap.data() as
          | {
            address?: {
              line1?: string;
              district?: string;
              province?: string;
              zip?: string;
            };
          }
          | undefined;
        const address = data?.address;
        const hasAddress =
          !!address &&
          [address.line1, address.district, address.province, address.zip].every(
            (value) => typeof value === "string" && value.trim().length > 0,
          );
        if (!cancelled) {
          setAddressReady(hasAddress);
          setAddressChecked(true);
        }
      } catch {
        if (!cancelled) {
          setAddressReady(false);
          setAddressChecked(true);
        }
      }
    }
    void checkAddress();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (addressChecked && !addressReady) {
      import("sweetalert2").then((x) => {
        const Swal = x.default;
        Swal.fire({
          title: lang === "th" ? "กรุณากรอกข้อมูลส่วนตัว" : "Profile Required",
          text: lang === "th"
            ? "เพื่อความรวดเร็วในการให้บริการ กรุณากรอกชื่อ เบอร์โทร และที่อยู่ ให้ครบถ้วนก่อนเริ่มแจ้งซ่อมครับ"
            : "Please complete your profile and address before submitting a request.",
          icon: "warning",
          confirmButtonText: lang === "th" ? "ไปหน้าแก้ไขข้อมูล" : "Edit Profile",
          confirmButtonColor: "#059669",
          allowOutsideClick: false,
        }).then(() => {
          router.push("/profile/edit");
        });
      });
    }
  }, [addressChecked, addressReady, router, lang]);

  const onSubmit = async (values: TicketFormValues) => {
    setMessage("");
    setProgress(0);
    if (isFirebaseConfigured && vehicleOptions.length === 0) {
      const text =
        lang === "th"
          ? "ยังไม่มีรุ่นรถในระบบ กรุณาเพิ่มใน backoffice ก่อน"
          : "No vehicles found. Please add vehicles in backoffice.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
      return;
    }
    if (!addressReady) {
      const text =
        lang === "th"
          ? "กรุณากรอกที่อยู่ในโปรไฟล์ก่อนแจ้งซ่อม"
          : "Please update your address before submitting a ticket.";
      setMessage(text);
      await showErrorAlert({ title: "Error", text });
      return;
    }
    const selectedVehicle = vehicleOptions.find(
      (vehicle) => vehicle.id === values.vehicleId,
    );
    const title =
      selectedVehicle?.name ??
      (values.vehicleId === "other" && values.customVehicle ? values.customVehicle : values.vehicleId) ??
      "Unknown vehicle";
    const result = await createTicket(
      {
        title,
        category: "repair",
        description: values.description,
        vehicleId: values.vehicleId,
        repairDate: values.repairDate,
      },
      files,
      setProgress,
    );
    if (result.ok) {
      // 🧹 Clear localStorage on successful submit
      localStorage.removeItem("ticketForm");

      await showSuccessAlert({ title: t("ticket.success") });
      reset();
      setFiles([]);
      setProgress(0);
      router.push(`/tickets/${result.id}`);
      return;
    }
    const errorText =
      result.error ?? (lang === "th" ? "ส่งคำร้องไม่สำเร็จ" : "Submit failed.");
    setMessage(errorText);
    await showErrorAlert({ title: "Error", text: errorText });
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[--text-strong]">
          {t("ticket.formTitle")}
        </h3>
        <p className="text-sm text-[--text-soft]">{t("ticket.formHint")}</p>
        <p className="text-xs text-[--text-soft]">
          {lang === "th"
            ? "ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอกให้ครบ มิฉะนั้นจะส่งคำร้องไม่ได้"
            : "Fields marked with * are required to submit the ticket."}
        </p>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {lang === "th" ? "วันที่แจ้งซ่อม" : "Repair date"} *
          </label>
          <Input type="date" {...register("repairDate")} />
          {errors.repairDate ? (
            <p className="text-xs text-rose-600">{errors.repairDate.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {lang === "th" ? "รายการที่ซ่อม" : "Vehicle"} *
          </label>
          <Select {...register("vehicleId")}>
            {vehicleOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            <option value="other">
              {lang === "th" ? "อื่นๆ (กรุณาระบุ)" : "Other (please specify)"}
            </option>
          </Select>
          {!vehicleOptions.length && isFirebaseConfigured ? (
            <p className="text-xs text-rose-600">
              {lang === "th"
                ? "ยังไม่มีรุ่นรถในระบบ กรุณาเพิ่มใน backoffice ก่อน"
                : "No vehicles found. Please add vehicles in backoffice."}
            </p>
          ) : null}
          {errors.vehicleId ? (
            <p className="text-xs text-rose-600">{errors.vehicleId.message}</p>
          ) : null}

          {/* 🚗 Selected Product Image Display */}
          {selectedVehicleId && selectedVehicleId !== "other" && (() => {
            const selected = vehicleOptions.find(v => v.id === selectedVehicleId);
            if (selected?.image) {
              return (
                <div className="mt-2 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 max-w-[150px]">
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="h-28 w-full object-cover"
                  />
                  <div className="px-2 py-1 text-center text-[10px] font-semibold text-emerald-700 truncate">
                    {selected.name}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* 🚗 Custom Product Input Field */}
        {selectedVehicleId === "other" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[--text-mid]">
              {lang === "th" ? "ระบุรุ่นรถที่ต้องการแจ้งซ่อม" : "Specify vehicle model"} *
            </label>
            <Input
              {...register("customVehicle", {
                required: selectedVehicleId === "other" ?
                  (lang === "th" ? "กรุณาระบุรุ่นรถ" : "Please specify vehicle model")
                  : false
              })}
              placeholder={lang === "th" ? "กรอกรุ่นรถที่ต้องการแจ้งซ่อม" : "Enter vehicle model"}
            />
            {errors.customVehicle ? (
              <p className="text-xs text-rose-600">{errors.customVehicle.message}</p>
            ) : null}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {lang === "th" ? "สาเหตุที่แจ้งซ่อม" : "Issue detail"} *
          </label>
          <Textarea
            {...register("description")}
            placeholder={
              lang === "th"
                ? "อธิบายรายละเอียด อาการ และข้อมูลเพิ่มเติมที่เกี่ยวข้อง"
                : "Describe the issue, when it happens, and any extra context."
            }
            rows={5}
          />
          {errors.description ? (
            <p className="text-xs text-rose-600">{errors.description.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-mid]">
            {t("fields.attachments")}
          </label>
          <Input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          {files.length ? (
            <div className="text-xs text-[--text-soft] space-y-1 max-h-20 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-700 ml-2"
                    onClick={() => removeFile(index)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {imagePreviews.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {imagePreviews.map((item, idx) => {
                const fileIndex = files.indexOf(item.file);
                return (
                  <div
                    key={`${item.file.name}-${item.file.size}-${item.file.lastModified}`}
                    className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white group"
                  >
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="h-32 w-full object-cover"
                    />
                    {/* Overlay buttons */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {/* Replace/edit button */}
                      <label
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
                        title={lang === "th" ? "เปลี่ยนรูป" : "Replace"}
                      >
                        <span className="text-xs leading-none">✏️</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const newFile = e.target.files?.[0];
                            if (newFile && fileIndex >= 0) {
                              setFiles((prev) => {
                                const next = [...prev];
                                next[fileIndex] = newFile;
                                return next;
                              });
                            }
                          }}
                        />
                      </label>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeFile(fileIndex)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors text-xs font-bold"
                        title={lang === "th" ? "ลบรูป" : "Remove"}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="px-2 py-1 text-[10px] text-[--text-soft] truncate">
                      {item.file.name}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {progress > 0 ? (
            <div className="space-y-1">
              <div className="text-xs text-[--text-soft]">
                {t("actions.uploading")} {progress}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        {addressChecked && !addressReady ? (
          <p className="text-sm text-rose-600">
            {lang === "th"
              ? "กรุณากรอกที่อยู่ในโปรไฟล์ก่อนแจ้งซ่อม"
              : "Please update your address before submitting a ticket."}
          </p>
        ) : null}
        {message ? <p className="text-sm text-rose-600">{message}</p> : null}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (addressChecked && !addressReady) ||
              (isFirebaseConfigured && vehicleOptions.length === 0)
            }
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting ? "..." : t("actions.submit")}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              reset();
              setFiles([]);
              setMessage("");
            }}
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
