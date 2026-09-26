import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Renders an accessible language selection dropdown toggling English and Bengali
export const LanguageToggle = ({ variant = "outline", size = "icon", className = "" }) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || "en";

  const handleLanguageChange = (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_lang", lang);
    }
    i18n.changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size={size}
            className={`relative h-9 px-2.5 flex items-center gap-1.5 font-medium cursor-pointer ${className}`}
            title={t("language.switch_language", "Change Language / ভাষা পরিবর্তন")}
            aria-label="Language Selector"
          >
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentLang.startsWith("bn") ? "বাং" : "EN"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover">
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
          onClick={() => handleLanguageChange("en")}
        >
          <span className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground">EN</span>
            <span>English</span>
          </span>
          {!currentLang.startsWith("bn") && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
          onClick={() => handleLanguageChange("bn")}
        >
          <span className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground">BN</span>
            <span>বাংলা</span>
          </span>
          {currentLang.startsWith("bn") && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
