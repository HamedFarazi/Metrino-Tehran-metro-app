import React, { useState, useRef, useEffect, useMemo } from "react";
import { Home, Search, Map, Star } from "lucide-react";

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  labelFa: string;
  icon: IconComponentType;
  onClick?: () => void;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  activeIndex?: number;
  accentColor?: string;
}

const defaultItems: InteractiveMenuItem[] = [
  { label: "home",      labelFa: "خانه",          icon: Home },
  { label: "search",    labelFa: "جستجو",          icon: Search },
  { label: "map",       labelFa: "نقشه",           icon: Map },
  { label: "favorites", labelFa: "علاقه‌مندی",     icon: Star },
];

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  items,
  activeIndex: controlledIndex,
  accentColor,
}) => {
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    return isValid ? items! : defaultItems;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(controlledIndex ?? 0);

  // Sync with controlled index
  useEffect(() => {
    if (controlledIndex !== undefined) setActiveIndex(controlledIndex);
  }, [controlledIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemEl = itemRefs.current[activeIndex];
      const activeTextEl = textRefs.current[activeIndex];
      if (activeItemEl && activeTextEl) {
        activeItemEl.style.setProperty("--lineWidth", `${activeTextEl.offsetWidth}px`);
      }
    };
    setLineWidth();
    window.addEventListener("resize", setLineWidth);
    return () => window.removeEventListener("resize", setLineWidth);
  }, [activeIndex, finalItems]);

  const navStyle = useMemo(
    () => ({
      "--component-active-color": accentColor || "var(--component-active-color-default)",
    } as React.CSSProperties),
    [accentColor]
  );

  return (
    <nav className="menu" role="navigation" style={navStyle} dir="rtl">
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            className={`menu__item ${isActive ? "active" : ""}`}
            onClick={() => {
              setActiveIndex(index);
              item.onClick?.();
            }}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{ "--lineWidth": "0px" } as React.CSSProperties}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.labelFa}
          >
            <div className="menu__icon">
              <Icon className="icon" />
            </div>
            <strong
              className={`menu__text ${isActive ? "active" : ""}`}
              ref={(el) => { textRefs.current[index] = el as HTMLElement; }}
            >
              {item.labelFa}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
