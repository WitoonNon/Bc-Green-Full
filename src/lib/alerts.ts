import Swal from "sweetalert2";

type AlertOptions = {
  title: string;
  text?: string;
};

export function showSuccessAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
  });
}

export function showErrorAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
}
