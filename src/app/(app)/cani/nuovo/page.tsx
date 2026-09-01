"use client";

import { DogForm } from "@/components/dogs/DogForm";

export default function NuovoCanePage() {
  return <DogForm mode={{ kind: "create" }} />;
}
