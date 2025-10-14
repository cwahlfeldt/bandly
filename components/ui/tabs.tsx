import * as React from 'react';
import { View, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View className={cn('', className)}>{children}</View>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-center rounded-md bg-muted p-1',
        className
      )}>
      {children}
    </View>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function TabsTrigger({ value: triggerValue, className, children }: TabsTriggerProps) {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  return (
    <TextClassContext.Provider
      value={cn(
        'text-sm font-medium transition-all',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}>
      <Pressable
        onPress={() => onValueChange(triggerValue)}
        className={cn(
          'items-center justify-center rounded-sm px-3 py-1.5',
          isActive && 'bg-background shadow-sm',
          className
        )}>
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function TabsContent({ value: contentValue, className, children }: TabsContentProps) {
  const { value } = useTabsContext();

  if (value !== contentValue) {
    return null;
  }

  return <View className={cn('', className)}>{children}</View>;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
