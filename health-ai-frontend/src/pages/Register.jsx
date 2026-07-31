import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import {
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlineLock,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md';
import toast from 'react-hot-toast';

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.register(data.name, data.email, data.password);
      if (response.success) {
        toast.success('Registration successful! Logging in...');
        const loginResponse = await authService.login(data.email, data.password);
        if (loginResponse.success && loginResponse.token) {
          await login(loginResponse.token);
          navigate('/dashboard');
        } else {
          toast.error('Registered successfully, but auto-login failed. Please sign in manually.');
          navigate('/login');
        }
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Health AI to get your personalized plan">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<MdOutlinePerson size={20} />}
          error={errors.name?.message}
          {...register('name', {
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
          })}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={<MdOutlineEmail size={20} />}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<MdOutlineLock size={20} />}
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-fg-subtle hover:text-fg"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <MdOutlineVisibilityOff size={20} /> : <MdOutlineVisibility size={20} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<MdOutlineLock size={20} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-fg-subtle hover:text-fg"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <MdOutlineVisibilityOff size={20} /> : <MdOutlineVisibility size={20} />}
          </button>
        </div>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          Get Started
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
