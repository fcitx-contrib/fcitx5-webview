#pragma once

#include <utility>
#include <tuple>
#include <functional>

template <typename T>
struct function_traits;

// Plain functions.
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType(Args...)> {
    using return_type = ReturnType;
    static constexpr std::size_t arity = sizeof...(Args);
    using args_tuple = std::tuple<Args...>;
};

// Function pointers.
template <typename ReturnType, typename... Args>
struct function_traits<ReturnType(*)(Args...)> : function_traits<ReturnType(Args...)> {};

// std::function
template <typename ReturnType, typename... Args>
struct function_traits<std::function<ReturnType(Args...)>> : function_traits<ReturnType(Args...)> {};

// Functors and lambda expressions.
template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType(ClassType::*)(Args...)> : function_traits<ReturnType(Args...)> {};

template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType(ClassType::*)(Args...) const> : function_traits<ReturnType(Args...)> {};

template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType(ClassType::*)(Args...) volatile> : function_traits<ReturnType(Args...)> {};

template <typename ClassType, typename ReturnType, typename... Args>
struct function_traits<ReturnType(ClassType::*)(Args...) const volatile> : function_traits<ReturnType(Args...)> {};

template <typename T>
struct function_traits : function_traits<decltype(&T::operator())> {};

template <typename T>
function_traits<T> make_function_traits(const T&) {
    return function_traits<T>();
}
