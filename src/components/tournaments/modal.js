// Shared helpers for the tournament modals
export function stopModalPropagation(event) {
    event.stopPropagation();
}

export function getModalTitle(action) {
    const labels = {
        create: "Crear registro",
        edit: "Editar registro",
        delete: "Eliminar registro",
    };

    return labels[action] || "Gestionar registro";
}
