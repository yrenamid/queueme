import { reactive, computed, watch } from 'vue';

export interface CatalogForm {
  name: string;
  category?: string | null;
  description?: string;
  price: string | number | null;
  duration: string | number | null; // minutes
  available?: boolean;
}

export interface ValidationOptions {
  requireCategory?: boolean; // food items
  requireDuration?: boolean; // now required for both menu & services per request
  minPrice?: number; // default 0
  minDuration?: number; // default 1
}


// Handles use Catalog Item Validation
export function useCatalogItemValidation(form: CatalogForm, opts: ValidationOptions){
  const errors = reactive<{[k:string]: string}>({});


// Handles validate
  function validate(){

    if(!form.name || !form.name.toString().trim()) {
      errors.name = 'Name is required';
    } else if (form.name.toString().trim().length > 20) {
      errors.name = 'Name must be at most 20 characters';
    } else {
      errors.name = '';
    }


    if(opts.requireCategory){
      errors.category = !form.category ? 'Category is required' : '';
    } else {
      errors.category = '';
    }


    if(form.price === '' || form.price === null || form.price === undefined){
      errors.price = 'Price is required';
    } else {
      const num = Number(form.price);
      if(Number.isNaN(num)) errors.price = 'Price must be numeric';
      else if(num < (opts.minPrice ?? 0)) errors.price = `Price cannot be less than ${opts.minPrice ?? 0}`;
      else {
        const str = typeof form.price === 'number' ? form.price.toString() : form.price.toString();
        const parts = str.split('.');
        if(parts[1] && parts[1].length > 2) errors.price = 'Price can have at most 2 decimal places';
        else errors.price = '';
      }
    }


    if(form.duration === '' || form.duration === null || form.duration === undefined){
      errors.duration = 'Duration is required';
    } else {
      const d = Number(form.duration);
      if(Number.isNaN(d)) errors.duration = 'Duration must be numeric';
      else if(d < (opts.minDuration ?? 1)) errors.duration = `Duration must be at least ${opts.minDuration ?? 1} minute(s)`;
      else errors.duration = '';
    }
  }

  validate();
  watch(() => ({...form}), validate, { deep: true });

  const isValid = computed(() => Object.values(errors).every(v => !v));

  return { errors, isValid, validate };
}
