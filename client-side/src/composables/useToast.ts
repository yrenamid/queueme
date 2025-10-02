import Swal, { SweetAlertIcon } from 'sweetalert2';


// Handles use Toast
export function useToast() {

// Handles toast
  function toast(title: string, icon: SweetAlertIcon = 'success', timer = 1800) {
    Swal.fire({
      title,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    });
  }
  return { toast };
}

export default useToast;