import Swal, { SweetAlertIcon } from 'sweetalert2';
import type { SweetAlertOptions } from 'sweetalert2';
export function useToast() {

  function toast(
    title: string,
    icon: SweetAlertIcon = 'success',
    timer = 1800,
    options: Record<string, any> = {}
  ) {
    const base: SweetAlertOptions = {
      title,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: timer > 0,
    };
    const cfg: any = { ...base, ...(options || {}) };
    if (cfg.timer === 0 || cfg.timer == null) {
      cfg.timer = undefined; 
      cfg.timerProgressBar = false;
    }
    Swal.fire(cfg as SweetAlertOptions);
  }
  return { toast };
}

export default useToast;