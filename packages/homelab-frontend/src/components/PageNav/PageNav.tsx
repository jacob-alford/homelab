import { FaSolidCircleArrowLeft, FaSolidCircleArrowRight } from "solid-icons/fa"
import "./PageNav.css"

export interface PageNavProps {
  href: string
  label: string
  direction: "forward" | "back"
}

export function PageNav(props: PageNavProps) {
  return (
    <a href={props.href} class={`page-nav page-nav--${props.direction}`}>
      {props.direction === "back" && <FaSolidCircleArrowLeft />}
      <span>{props.label}</span>
      {props.direction === "forward" && <FaSolidCircleArrowRight />}
    </a>
  )
}
