import { useState } from 'react';
import { ChevronDown, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCourierProviders } from '@/hooks/use-couriers';
import PathaoCourierCard from './PathaoCourierCard';
import RedxCourierCard from './RedxCourierCard';

// Dashboard dispatch UI per courier key. Add a courier here once its backend service exists.
const DISPATCHERS = {
  pathao: { name: 'Pathao', Component: PathaoCourierCard },
  redx: { name: 'RedX', Component: RedxCourierCard },
};

// Full courier card for the order details page: the dispatched courier's card, else the first active one
export function CourierDetailsCard({ order, ...rest }) {
  const { data } = useCourierProviders();
  const dispatchedWith = order?.courier?.consignmentId ? order.courier.provider || 'pathao' : null;
  if (dispatchedWith && DISPATCHERS[dispatchedWith]) {
    const { Component } = DISPATCHERS[dispatchedWith];
    return <Component order={order} {...rest} />;
  }
  const active = (data?.enabledCouriers || []).filter((key) => DISPATCHERS[key]);
  return active.map((key) => {
    const { Component } = DISPATCHERS[key];
    return <Component key={key} order={order} {...rest} />;
  });
}

// "Send with courier" action for an order:
// - already dispatched → that courier's button (tracking), even if the courier is now disabled
// - one courier active → its own "Send with X" button
// - several active     → a dropdown to pick the courier
// - none active        → nothing
export default function CourierDispatchButton({
  order,
  buttonVariant = 'outline',
  buttonClassName = '',
  iconOnly = false,
}) {
  const { data, isLoading } = useCourierProviders();
  const [picked, setPicked] = useState(null);
  const [openSignal, setOpenSignal] = useState(0);

  const triggerProps = {
    order,
    triggerOnly: true,
    triggerButtonVariant: buttonVariant,
    triggerButtonClassName: buttonClassName,
    triggerIconOnly: iconOnly,
  };

  const dispatchedWith = order?.courier?.consignmentId ? order.courier.provider || 'pathao' : null;
  if (dispatchedWith && DISPATCHERS[dispatchedWith]) {
    const { Component } = DISPATCHERS[dispatchedWith];
    return <Component {...triggerProps} />;
  }

  if (isLoading) return null;
  const active = (data?.enabledCouriers || []).filter((key) => DISPATCHERS[key]);
  if (active.length === 0) return null;

  if (active.length === 1) {
    const { Component } = DISPATCHERS[active[0]];
    return <Component {...triggerProps} />;
  }

  const Picked = picked ? DISPATCHERS[picked].Component : null;
  const label = 'Send with courier';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant={buttonVariant} className={`gap-1.5 cursor-pointer font-medium ${buttonClassName}`} title={label}>
              <Truck className={iconOnly ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 text-primary'} />
              {iconOnly === 'responsive' ? (
                <span className="hidden md:inline text-xs font-medium">{label}</span>
              ) : (
                !iconOnly && label
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Choose courier</DropdownMenuLabel>
          {active.map((key) => (
            <DropdownMenuItem
              key={key}
              onClick={() => {
                setPicked(key);
                setOpenSignal((n) => n + 1);
              }}
            >
              <Truck className="h-3.5 w-3.5" /> {DISPATCHERS[key].name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {Picked && <Picked order={order} dialogOnly openSignal={openSignal} />}
    </>
  );
}
