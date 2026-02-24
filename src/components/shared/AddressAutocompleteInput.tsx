import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { cn } from '@/lib/utils';

interface AddressAutocompleteInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (address: string, city: string, state: string, zip: string) => void;
}

export const AddressAutocompleteInput = React.forwardRef<HTMLInputElement, AddressAutocompleteInputProps>(
  ({ value, onChange, onPlaceSelect, className, ...props }, _forwardedRef) => {
    const handlePlaceSelect = useCallback(
      (place: { address: string; city: string; state: string; zip: string }) => {
        onPlaceSelect(place.address, place.city, place.state, place.zip);
      },
      [onPlaceSelect]
    );

    const { inputRef } = useGooglePlacesAutocomplete({ onPlaceSelect: handlePlaceSelect });

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(className)}
          {...props}
        />
      </div>
    );
  }
);

AddressAutocompleteInput.displayName = 'AddressAutocompleteInput';
