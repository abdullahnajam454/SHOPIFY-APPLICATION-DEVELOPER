const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.errors?.[0]?.message ||
            data.message ||
            "Something went wrong"
        );
    }

    return data;
};

export default apiFetch;
