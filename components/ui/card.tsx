import { View } from 'react-native';
import { cn } from '@/lib/utils';

const Card = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return (
    <View
      className={cn('rounded-lg border border-border bg-card shadow-sm', className)}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return <View className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
};

const CardTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return <View className={cn('', className)} {...props} />;
};

const CardDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return <View className={cn('', className)} {...props} />;
};

const CardContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return <View className={cn('p-6 pt-0', className)} {...props} />;
};

const CardFooter = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) => {
  return <View className={cn('flex flex-row items-center p-6 pt-0', className)} {...props} />;
};

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
