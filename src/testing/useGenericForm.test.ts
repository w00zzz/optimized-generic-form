import { renderHook, act } from "@testing-library/react";
import { useGenericForm, type FormControl } from "../hooks/useGenericForm";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("useGenericForm", () => {
  const controlesIniciales: FormControl[] = [
    {
      name: "correo",
      type: "email",
      label: "Correo electrónico",
      value: "",
      required: true,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Formato de correo electrónico inválido",
      },
    },
    {
      name: "edad",
      type: "number",
      label: "Edad",
      value: "",
      validation: {
        pattern: /^[1-9]\d*$/,
        message: "La edad debe ser un número positivo",
      },
    },
  ];

  const mockEnviarFormulario = vi.fn();

  // Reiniciar el estado del mock antes de cada prueba
  beforeEach(() => {
    mockEnviarFormulario.mockClear();
  });

  it("debería inicializarse con los controles dados", () => {
    const { result } = renderHook(() =>
      useGenericForm({
        initialControls: controlesIniciales,
        onSubmit: mockEnviarFormulario,
      })
    );

    expect(result.current.controls).toEqual(controlesIniciales);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.formError).toBeNull();
  });

  it("debería actualizar el valor del control en handleChange", () => {
    const { result } = renderHook(() =>
      useGenericForm({
        initialControls: controlesIniciales,
        onSubmit: mockEnviarFormulario,
      })
    );

    act(() => {
      result.current.handleChange("correo", "prueba@ejemplo.com");
    });

    expect(result.current.controls[0].value).toBe("prueba@ejemplo.com");
    expect(result.current.controls[0].error).toBeUndefined();
  });

  it("debería validar los campos requeridos", () => {
    const { result } = renderHook(() =>
      useGenericForm({
        initialControls: controlesIniciales,
        onSubmit: mockEnviarFormulario,
      })
    );

    act(() => {
      result.current.handleChange("correo", "");
    });

    expect(result.current.controls[0].error).toBe(
      "Formato de correo electrónico inválido"
    );
  });

  it("debería manejar el envío del formulario", async () => {
    const { result } = renderHook(() =>
      useGenericForm({
        initialControls: controlesIniciales,
        onSubmit: mockEnviarFormulario,
      })
    );

    act(() => {
      result.current.handleChange("correo", "prueba@ejemplo.com");
      result.current.handleChange("edad", 25);
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockEnviarFormulario).toHaveBeenCalledWith({
      correo: "prueba@ejemplo.com",
      edad: 25,
    });
    expect(result.current.formError).toBeNull();
  });

  it("debería establecer formError si la validación falla durante el envío", async () => {
    const { result } = renderHook(() =>
      useGenericForm({
        initialControls: controlesIniciales,
        onSubmit: mockEnviarFormulario,
      })
    );

    act(() => {
      result.current.handleChange("correo", "");
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.formError).toBe("Please fix the errors in the form");
    expect(mockEnviarFormulario).not.toHaveBeenCalled();
  });
});
