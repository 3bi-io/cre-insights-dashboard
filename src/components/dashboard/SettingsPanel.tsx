
import React, { useState } from 'react';
import { Settings, User, Palette, Bell, Database, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/ThemeProvider';
import { useNavigate } from 'react-router-dom';

const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: User,
      label: 'Account Settings',
      onClick: () => {
        navigate('/dashboard/settings');
        setIsOpen(false);
      }
    },
    {
      icon: Bell,
      label: 'Notification Preferences',
      onClick: () => {
        navigate('/dashboard/settings');
        setIsOpen(false);
      }
    },
    {
      icon: Database,
      label: 'Data & Privacy',
      onClick: () => {
        navigate('/dashboard/privacy-controls');
        setIsOpen(false);
      }
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => {
        // Could open help documentation or support chat
        window.open('https://docs.lovable.dev/', '_blank');
        setIsOpen(false);
      }
    }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Settings className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Settings</h3>
        </div>
        
        <div className="p-2">
          {/* Theme Selection */}
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTheme(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto p-2"
              onClick={item.onClick}
            >
              <item.icon className="w-4 h-4 mr-2" />
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsPanel;
